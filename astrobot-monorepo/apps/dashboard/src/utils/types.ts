/**
 * Shared type definitions for the AstroBot Dashboard components
 */

// Standard emotional state type used throughout the application
export type EmotionalState = 'neutral' | 'happy' | 'thinking' | 'alert' | 'sad' | 'confused';

// Particle type definitions
export type ParticleType = 'energy' | 'orbit' | 'data' | 'ambient';

// Standard showParticles options
export type ParticleDisplay = 'none' | 'temporary' | 'typing' | 'intense';

// Standard component sizes
export type ComponentSize = 'small' | 'default' | 'large' | 'xlarge';

// 3D model related types
export type ModelQuality = 'low' | 'medium' | 'high' | 'ultra';
export type AnimationSequence = 'idle' | 'walk' | 'run' | 'wave' | 'point' | 'nod' | 'shake' | 'scan' | 'think';