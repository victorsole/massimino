// src/lib/animations/transitions.ts
// Common transition configurations

import { Transition } from 'framer-motion';

// Spring transitions
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

export const smoothSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
};

// Tween transitions
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

export const slowTransition: Transition = {
  duration: 0.6,
  ease: 'easeOut',
};

export const fastTransition: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

// Page transitions
export const pageTransition: Transition = {
  duration: 0.4,
  ease: [0.43, 0.13, 0.23, 0.96],
};

// Modal transitions
export const modalTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Backdrop transitions
export const backdropTransition: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};
