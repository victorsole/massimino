// Workout Log Components
// Re-exports for convenient imports

// Navigation
export { MobileTabNav, DesktopTabNav, ResponsiveTabNav } from './mobile_tab_nav';
export type { WorkoutTab } from './mobile_tab_nav';

// Cards
export { WorkoutEntryCardV2, WorkoutEntryCardCompact } from './workout_entry_card_v2';
export type { WorkoutEntryV2 } from './workout_entry_card_v2';

// Modals
export { AddEntryModal } from './add_entry_modal';
export type { AddEntryData, ExerciseOption } from './add_entry_modal';

// Timer
export { RestTimerOverlay, RestTimerBarCompact } from './rest_timer_overlay';

// Empty States
export { WorkoutEmptyState, WorkoutEmptyStateMinimal } from './workout_empty_state';

// Session
export { SessionStatusBar, SessionTimerBadge } from './session_status_bar';

// FAB
export { FloatingActionButton, ExtendedFAB } from './floating_action_button';

// Legacy exports (keep backwards compatibility)
export { WorkoutCard } from './workout_card';
export { CollapsibleSection } from './collapsible_section';
