/**
 * Demo Mode Configuration
 * Replaces the static build-time VITE_ENABLE_DEMO_MODE with a runtime-evaluable state.
 */

const LOCAL_STORAGE_KEY = 'fairshare_demo_mode';

export const isDemoMode = (): boolean => {
  return (
    import.meta.env.VITE_ENABLE_DEMO_MODE === 'true' ||
    localStorage.getItem(LOCAL_STORAGE_KEY) === 'true'
  );
};

export const enableDemoMode = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
  // Optional: We can dispatch a custom event here if we wanted components to react 
  // without a hard reload, but a window.location change is usually safest to wipe memory state.
};

export const disableDemoMode = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};
