"use client";

import { PRE_SIGNUP_EXIT_URL } from "./onboarding-data";

export const navigateToPreSignupExit = () => {
  window.location.assign(PRE_SIGNUP_EXIT_URL);
};

