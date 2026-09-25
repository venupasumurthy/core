'use client';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    step: 1,
    title: 'Draw Work Zones on the Map',
    text: 'Click the "Draw Zone" tool on the canvas to outline areas where work needs to be done (e.g. Water Tank Area, Tree Planting Field). Configure task type, difficulty, time limit, and required resources.',
    icon: '🗺️',
    visual: 'DRAW',
  },
  {
    step: 2,
    title: 'Create Your Heterogeneous Fleet',
    text: 'Use the "Create Robot" button to build and name specialized robots: Water Collectors, Planters, Transporters, Cleaners, and Heavy Lifters with custom battery, health, speed, and capacity stats.',
    icon: '🤖',
    visual: 'CREATE',
  },
  {
    step: 3,
    title: 'Assign Robots by Drag-and-Drop',
    text: 'Drag any idle robot from the fleet panel and drop it directly onto a work zone on the map. The platform automatically assigns the work order.',
    icon: '🎯',
    visual: 'DRAG',
  },
  {
    step: 4,
    title: 'Real-Time Physical Travel & Work Loop',
    text: 'Watch your robot smoothly travel to the zone (like a real autonomous vacuum cleaner!), begin working with a live deadline countdown, and deplete battery and health tied to task hardness.',
    icon: '⚡',
    visual: 'TRAVEL',
  },
  {
    step: 5,
    title: 'Autonomous Multi-Robot Coordination',
    text: 'When one robot produces what another needs (e.g. Water Waste Collector produces water needed by a Tree Planter), the platform detects this dependency and prompts you to dispatch a Transport Robot with live Cisco topology telemetry!',
    icon: '🔄',
    visual: 'COORDINATE',
  },
];

export default function OnboardingModal({ isOpen, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[currentStep];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass glow"
        style={{
          width: '100%',
          maxWidth: 620,
          padding: '36px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 24,
          position: 'relative',
        }}
      >
        {/* Mascot & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {/* Animated SVG Robot Mascot */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(6, 182, 212, 0.35)',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="2.5" />
              <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="2.5" />
              <path d="M9 19h6" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#4ade80',
                border: '2px solid #0f172a',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              <span>RoboGuide Mascot Assistant</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
              Welcome to CORE Fleet Operations!
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Step {currentStep + 1} of {STEPS.length}: {current.title}
            </p>
          </div>
        </div>

        {/* Mascot Speech Bubble Card */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 28,
            minHeight: 140,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span style={{ fontSize: 32 }}>{current.icon}</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e0e7ff', marginBottom: 6 }}>
                {current.title}
              </h3>
              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.65 }}>
                {current.text}
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(idx)}
              style={{
                width: idx === currentStep ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: idx === currentStep ? '#6366f1' : 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={onClose}
          >
            Skip Instructions
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {currentStep > 0 && (
              <button
                className="btn btn-ghost"
                style={{ width: 'auto', padding: '10px 20px' }}
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Previous
              </button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                style={{ width: 'auto', padding: '10px 24px' }}
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next Step →
              </button>
            ) : (
              <button
                className="btn btn-success"
                style={{ width: 'auto', padding: '10px 28px' }}
                onClick={onClose}
              >
                🚀 Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
