"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics/react";
import { navigateToPreSignupExit } from "@/components/pages/onboarding/onboarding-navigation";
import {
  emptyPreSignupAnswers,
  getSelectedValues,
  PRE_SIGNUP_STORAGE_KEY,
  PRE_SIGNUP_STORAGE_TTL_MS,
  preSignupQuestions,
  type PreSignupAnswers,
  type PreSignupOptionValue,
  type PreSignupQuestion,
  type StoredPreSignupState,
} from "./onboarding-data";

const isPreSignupAnswers = (value: unknown): value is PreSignupAnswers => {
  if (!value || typeof value !== "object") return false;
  const answers = value as Partial<PreSignupAnswers>;
  return (
    (answers.sellingStage === null || typeof answers.sellingStage === "string") &&
    Array.isArray(answers.heardFrom) &&
    Array.isArray(answers.bottlenecks) &&
    (answers.expectedDailyOrders === null || typeof answers.expectedDailyOrders === "string")
  );
};

const safeTrack = (
  eventName: string,
  properties: Record<string, string | number | boolean>
) => {
  try {
    track(eventName, properties);
  } catch {
    // Analytics must never block onboarding.
  }
};

const createPreSignupSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getDefaultPreSignupState = (): StoredPreSignupState => ({
  sessionId: typeof window === "undefined" ? "" : createPreSignupSessionId(),
  step: 0,
  completed: false,
  answers: emptyPreSignupAnswers,
  expiresAt: 0,
});

const readStoredPreSignupState = (): StoredPreSignupState => {
  if (typeof window === "undefined") return getDefaultPreSignupState();

  try {
    const stored = window.localStorage.getItem(PRE_SIGNUP_STORAGE_KEY);
    if (!stored) return getDefaultPreSignupState();

    const parsed = JSON.parse(stored) as Partial<StoredPreSignupState>;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(PRE_SIGNUP_STORAGE_KEY);
      return getDefaultPreSignupState();
    }

    if (!isPreSignupAnswers(parsed.answers)) return getDefaultPreSignupState();

    if (parsed.completed) {
      window.localStorage.removeItem(PRE_SIGNUP_STORAGE_KEY);
      return getDefaultPreSignupState();
    }

    return {
      answers: parsed.answers,
      completed: false,
      completedAt:
        typeof parsed.completedAt === "number" && Number.isFinite(parsed.completedAt)
          ? parsed.completedAt
          : undefined,
      expiresAt: parsed.expiresAt,
      sessionId:
        typeof parsed.sessionId === "string" && parsed.sessionId.trim()
          ? parsed.sessionId.trim().slice(0, 120)
          : createPreSignupSessionId(),
      sheetSyncedAt:
        typeof parsed.sheetSyncedAt === "number" && Number.isFinite(parsed.sheetSyncedAt)
          ? parsed.sheetSyncedAt
          : undefined,
      step:
        typeof parsed.step === "number"
          ? Math.min(Math.max(parsed.step, 0), preSignupQuestions.length - 1)
          : 0,
    };
  } catch {
    window.localStorage.removeItem(PRE_SIGNUP_STORAGE_KEY);
    return getDefaultPreSignupState();
  }
};

const syncPreSignupAnswersToSheet = async (state: StoredPreSignupState) => {
  const response = await fetch("/api/pre-signup/google-sheet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: state.sessionId,
      completedAt: state.completedAt,
      answers: state.answers,
    }),
  });

  if (!response.ok) return false;

  const result = (await response.json().catch(() => null)) as { success?: unknown } | null;
  return result?.success === true;
};

export const useOnboardingFlow = () => {
  const [preSignupState, setPreSignupState] =
    useState<StoredPreSignupState>(readStoredPreSignupState);
  const [isSignUpOpen, setIsSignUpOpen] = useState(preSignupState.completed);
  const sheetSyncInFlight = useRef(false);

  const { answers, completed: showPreview, step: currentStep } = preSignupState;
  const question = preSignupQuestions[currentStep];
  const selectedValues = getSelectedValues(answers, question);
  const canContinue = selectedValues.length > 0;

  useEffect(() => {
    try {
      const stateToStore: StoredPreSignupState = {
        ...preSignupState,
        expiresAt: Date.now() + PRE_SIGNUP_STORAGE_TTL_MS,
      };
      window.localStorage.setItem(PRE_SIGNUP_STORAGE_KEY, JSON.stringify(stateToStore));
    } catch {
      // Local persistence is helpful, not required.
    }
  }, [preSignupState]);

  useEffect(() => {
    if (!showPreview || preSignupState.sheetSyncedAt || sheetSyncInFlight.current) return;

    sheetSyncInFlight.current = true;

    void syncPreSignupAnswersToSheet(preSignupState)
      .then((didSync) => {
        if (!didSync) return;

        setPreSignupState((previousState) => {
          if (previousState.sessionId !== preSignupState.sessionId) return previousState;

          return {
            ...previousState,
            sheetSyncedAt: Date.now(),
          };
        });
      })
      .finally(() => {
        sheetSyncInFlight.current = false;
      });
  }, [preSignupState, showPreview]);

  const handleSelect = useCallback(
    (selectedQuestion: PreSignupQuestion, value: PreSignupOptionValue) => {
      setPreSignupState((previousState) => {
        const previousAnswers = previousState.answers;

        if (selectedQuestion.multiple) {
          const key = selectedQuestion.id as "heardFrom" | "bottlenecks";
          const selectedQuestionValues = previousAnswers[key] as PreSignupOptionValue[];
          const isSelected = selectedQuestionValues.includes(value);

          return {
            ...previousState,
            answers: {
              ...previousAnswers,
              [key]: isSelected
                ? selectedQuestionValues.filter((selectedValue) => selectedValue !== value)
                : [...selectedQuestionValues, value],
            },
          };
        }

        return {
          ...previousState,
          answers: {
            ...previousAnswers,
            [selectedQuestion.id]: value,
          },
        };
      });
    },
    []
  );

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      navigateToPreSignupExit();
      return;
    }

    setPreSignupState((previousState) => {
      return {
        ...previousState,
        step: Math.max(previousState.step - 1, 0),
      };
    });
  }, [currentStep]);

  const handleNext = useCallback(() => {
    const selectedQuestion = preSignupQuestions[currentStep];
    const currentSelectedValues = getSelectedValues(answers, selectedQuestion);

    if (currentSelectedValues.length === 0) return;

    safeTrack("pre_signup_step_completed", {
      step: currentStep + 1,
      question: selectedQuestion.id,
      selectionCount: currentSelectedValues.length,
    });

    currentSelectedValues.forEach((selectedValue) => {
      safeTrack("pre_signup_option_selected", {
        step: currentStep + 1,
        question: selectedQuestion.id,
        option: selectedValue,
      });
    });

    if (currentStep === preSignupQuestions.length - 1) {
      const completedAt = Date.now();

      setPreSignupState((previousState) => ({
        ...previousState,
        completed: true,
        completedAt,
      }));
      setIsSignUpOpen(true);
      safeTrack("pre_signup_completed", {
        questionCount: preSignupQuestions.length,
      });
      return;
    }

    setPreSignupState((previousState) => ({
      ...previousState,
      step: Math.min(previousState.step + 1, preSignupQuestions.length - 1),
    }));
  }, [answers, currentStep]);

  return {
    answers,
    canContinue,
    currentStep,
    handleBack,
    handleNext,
    handleSelect,
    isSignUpOpen,
    question,
    selectedValues,
    setIsSignUpOpen,
    showPreview,
    totalSteps: preSignupQuestions.length,
  };
};
