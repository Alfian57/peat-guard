const DEMO_VOLUNTEER_ID = "70000000-0000-4000-8000-000000000001";
const DEMO_VOLUNTEER_EMAIL = "relawan@gmail.com";

export function canUseDemoSamples(input: {
  demoLoginEnabled: boolean;
  ownerId: string | null;
  hasVerifiedDemoSession: boolean;
  offlineKnownVolunteerOwner: boolean;
  sessionEmail: string | null;
}): boolean {
  if (!input.demoLoginEnabled || input.ownerId !== DEMO_VOLUNTEER_ID) {
    return false;
  }

  return (
    input.offlineKnownVolunteerOwner ||
    (input.hasVerifiedDemoSession &&
      input.sessionEmail === DEMO_VOLUNTEER_EMAIL)
  );
}
