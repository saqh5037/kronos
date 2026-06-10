"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  FitnessReason,
  BiologicalSex,
  FitnessExperience,
  FitnessGoal,
  RoutinePreference,
  TrainingLocation,
} from "@prisma/client";
import { deriveTrainingLocation } from "./derive-training-location";

export type WizardState = {
  step: number;
  fitnessReason: FitnessReason | null;
  biologicalSex: BiologicalSex | null;
  weightKg: number | null;
  heightCm: number | null;
  ageYears: number | null;
  trackMenstrualCycle: boolean;
  fitnessExperience: FitnessExperience | null;
  fitnessGoal: FitnessGoal | null;
  weeklyFrequency: number | null;
  routinePreference: RoutinePreference | null;
  excludedMuscles: string[];
  trainingLocation: TrainingLocation | null;
  trainsOnOwnToo: boolean;
  pushNotificationsEnabled: boolean;
};

type WizardAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_FITNESS_REASON"; payload: FitnessReason }
  | { type: "SET_BIOLOGICAL_SEX"; payload: BiologicalSex }
  | { type: "SET_WEIGHT"; payload: number }
  | { type: "SET_HEIGHT"; payload: number }
  | { type: "SET_AGE"; payload: number }
  | { type: "SET_TRACK_MENSTRUAL_CYCLE"; payload: boolean }
  | { type: "SET_FITNESS_EXPERIENCE"; payload: FitnessExperience }
  | { type: "SET_FITNESS_GOAL"; payload: FitnessGoal }
  | { type: "SET_WEEKLY_FREQUENCY"; payload: number }
  | { type: "SET_ROUTINE_PREFERENCE"; payload: RoutinePreference }
  | { type: "SET_EXCLUDED_MUSCLES"; payload: string[] }
  | { type: "SET_TRAINING_LOCATION"; payload: TrainingLocation }
  | { type: "CLEAR_TRAINING_LOCATION" }
  | { type: "SET_TRAINS_OWN_TOO"; payload: boolean }
  | { type: "SET_PUSH_NOTIFICATIONS"; payload: boolean };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_FITNESS_REASON":
      return { ...state, fitnessReason: action.payload };
    case "SET_BIOLOGICAL_SEX":
      return { ...state, biologicalSex: action.payload };
    case "SET_WEIGHT":
      return { ...state, weightKg: action.payload };
    case "SET_HEIGHT":
      return { ...state, heightCm: action.payload };
    case "SET_AGE":
      return { ...state, ageYears: action.payload };
    case "SET_TRACK_MENSTRUAL_CYCLE":
      return { ...state, trackMenstrualCycle: action.payload };
    case "SET_FITNESS_EXPERIENCE":
      return { ...state, fitnessExperience: action.payload };
    case "SET_FITNESS_GOAL":
      return { ...state, fitnessGoal: action.payload };
    case "SET_WEEKLY_FREQUENCY":
      return { ...state, weeklyFrequency: action.payload };
    case "SET_ROUTINE_PREFERENCE":
      return { ...state, routinePreference: action.payload };
    case "SET_EXCLUDED_MUSCLES":
      return { ...state, excludedMuscles: action.payload };
    case "SET_TRAINING_LOCATION":
      return { ...state, trainingLocation: action.payload };
    case "CLEAR_TRAINING_LOCATION":
      return { ...state, trainingLocation: null };
    case "SET_TRAINS_OWN_TOO":
      return { ...state, trainsOnOwnToo: action.payload };
    case "SET_PUSH_NOTIFICATIONS":
      return { ...state, pushNotificationsEnabled: action.payload };
    default:
      return state;
  }
}

const INITIAL_STATE: WizardState = {
  step: 1,
  fitnessReason: null,
  biologicalSex: null,
  // Defaults razonables: el atleta los ve pre-llenados en los NumberSteppers y
  // puede continuar sin tener que tocar +/- para "registrar" cada campo.
  // Antes estaban en null y solo eran visibles via `value ?? 70` en el child,
  // lo que requería interacción con cada stepper para activar "Siguiente".
  weightKg: 70,
  heightCm: 170,
  ageYears: 25,
  trackMenstrualCycle: false,
  fitnessExperience: null,
  fitnessGoal: null,
  weeklyFrequency: null,
  routinePreference: null,
  excludedMuscles: [],
  trainingLocation: null,
  trainsOnOwnToo: false,
  pushNotificationsEnabled: false,
};

export function useWizardState(isB2B = false) {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Debounced auto-save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("kronos_wizard_state", JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save wizard state:", err);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kronos_wizard_state");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WizardState>;
        // Dispatch individual actions to load saved state
        if (parsed.step) dispatch({ type: "SET_STEP", payload: parsed.step });
        if (parsed.fitnessReason)
          dispatch({
            type: "SET_FITNESS_REASON",
            payload: parsed.fitnessReason,
          });
        if (parsed.biologicalSex)
          dispatch({
            type: "SET_BIOLOGICAL_SEX",
            payload: parsed.biologicalSex,
          });
        if (parsed.weightKg)
          dispatch({ type: "SET_WEIGHT", payload: parsed.weightKg });
        if (parsed.heightCm)
          dispatch({ type: "SET_HEIGHT", payload: parsed.heightCm });
        if (parsed.ageYears)
          dispatch({ type: "SET_AGE", payload: parsed.ageYears });
        if (parsed.trackMenstrualCycle)
          dispatch({
            type: "SET_TRACK_MENSTRUAL_CYCLE",
            payload: parsed.trackMenstrualCycle,
          });
        if (parsed.fitnessExperience)
          dispatch({
            type: "SET_FITNESS_EXPERIENCE",
            payload: parsed.fitnessExperience,
          });
        if (parsed.fitnessGoal)
          dispatch({ type: "SET_FITNESS_GOAL", payload: parsed.fitnessGoal });
        if (parsed.weeklyFrequency)
          dispatch({
            type: "SET_WEEKLY_FREQUENCY",
            payload: parsed.weeklyFrequency,
          });
        if (parsed.routinePreference)
          dispatch({
            type: "SET_ROUTINE_PREFERENCE",
            payload: parsed.routinePreference,
          });
        if (parsed.excludedMuscles && parsed.excludedMuscles.length > 0)
          dispatch({
            type: "SET_EXCLUDED_MUSCLES",
            payload: parsed.excludedMuscles,
          });
        // Restore trainsOnOwnToo first so we can normalize trainingLocation
        const restoredTrainsOnOwnToo = parsed.trainsOnOwnToo ?? false;
        if (parsed.trainsOnOwnToo)
          dispatch({
            type: "SET_TRAINS_OWN_TOO",
            payload: parsed.trainsOnOwnToo,
          });
        // Normalize trainingLocation for B2B restore: if trainsOnOwnToo=false
        // and location is null (was never set or came from an old session),
        // auto-set to BOX_B2B so finish() validation doesn't dead-end.
        const normalizedLocation = deriveTrainingLocation({
          isB2B,
          trainsOnOwnToo: restoredTrainsOnOwnToo,
          currentLocation: parsed.trainingLocation ?? null,
        });
        if (normalizedLocation !== null)
          dispatch({
            type: "SET_TRAINING_LOCATION",
            payload: normalizedLocation,
          });
        if (parsed.pushNotificationsEnabled)
          dispatch({
            type: "SET_PUSH_NOTIFICATIONS",
            payload: parsed.pushNotificationsEnabled,
          });
      } else if (isB2B) {
        // No saved state + B2B: auto-set BOX_B2B so the validation never trips
        // on the fresh path where the user simply goes step 1 → 9 without
        // touching the "También entreno solo" checkbox.
        dispatch({ type: "SET_TRAINING_LOCATION", payload: "BOX_B2B" });
      }
    } catch (err) {
      console.warn("Failed to load wizard state:", err);
    }
  }, [isB2B]);

  const setStep = useCallback((step: number) => {
    dispatch({ type: "SET_STEP", payload: step });
  }, []);

  const setFitnessReason = useCallback((reason: FitnessReason) => {
    dispatch({ type: "SET_FITNESS_REASON", payload: reason });
  }, []);

  const setBiologicalSex = useCallback((sex: BiologicalSex) => {
    dispatch({ type: "SET_BIOLOGICAL_SEX", payload: sex });
  }, []);

  const setWeight = useCallback((weight: number) => {
    dispatch({ type: "SET_WEIGHT", payload: weight });
  }, []);

  const setHeight = useCallback((height: number) => {
    dispatch({ type: "SET_HEIGHT", payload: height });
  }, []);

  const setAge = useCallback((age: number) => {
    dispatch({ type: "SET_AGE", payload: age });
  }, []);

  const setTrackMenstrualCycle = useCallback((track: boolean) => {
    dispatch({ type: "SET_TRACK_MENSTRUAL_CYCLE", payload: track });
  }, []);

  const setFitnessExperience = useCallback((experience: FitnessExperience) => {
    dispatch({ type: "SET_FITNESS_EXPERIENCE", payload: experience });
  }, []);

  const setFitnessGoal = useCallback((goal: FitnessGoal) => {
    dispatch({ type: "SET_FITNESS_GOAL", payload: goal });
  }, []);

  const setWeeklyFrequency = useCallback((frequency: number) => {
    dispatch({ type: "SET_WEEKLY_FREQUENCY", payload: frequency });
  }, []);

  const setRoutinePreference = useCallback((preference: RoutinePreference) => {
    dispatch({ type: "SET_ROUTINE_PREFERENCE", payload: preference });
  }, []);

  const setExcludedMuscles = useCallback((muscles: string[]) => {
    dispatch({ type: "SET_EXCLUDED_MUSCLES", payload: muscles });
  }, []);

  const setTrainingLocation = useCallback((location: TrainingLocation) => {
    dispatch({ type: "SET_TRAINING_LOCATION", payload: location });
  }, []);

  const setTrainsOwnToo = useCallback(
    (trainsOwn: boolean) => {
      dispatch({ type: "SET_TRAINS_OWN_TOO", payload: trainsOwn });
      // When the B2B toggle changes, re-derive the location immediately so
      // the state is always consistent (no manual location needed for plain B2B).
      const derived = deriveTrainingLocation({
        isB2B,
        trainsOnOwnToo: trainsOwn,
        currentLocation: state.trainingLocation,
      });
      if (derived !== null) {
        dispatch({ type: "SET_TRAINING_LOCATION", payload: derived });
      } else {
        dispatch({ type: "CLEAR_TRAINING_LOCATION" });
      }
    },
    [isB2B, state.trainingLocation],
  );

  const setPushNotifications = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_PUSH_NOTIFICATIONS", payload: enabled });
  }, []);

  return {
    state,
    setStep,
    setFitnessReason,
    setBiologicalSex,
    setWeight,
    setHeight,
    setAge,
    setTrackMenstrualCycle,
    setFitnessExperience,
    setFitnessGoal,
    setWeeklyFrequency,
    setRoutinePreference,
    setExcludedMuscles,
    setTrainingLocation,
    setTrainsOwnToo,
    setPushNotifications,
  };
}
