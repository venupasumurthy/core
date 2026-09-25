'use client';
import { useState } from 'react';
import type { InterRobotMessage, PlatformRobot, WorkZone } from '@/types/platform';
import { processOperatorAIDirective } from '@/lib/aiFleetAgent';

interface Props {
  robots: PlatformRobot[];
  zones: WorkZone[];
  messages: InterRobotMessage[];
  onSendMessage: (msg: { from: string; to: string; content: string; badge: 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT' }) => void;
  isAiAutoChatActive: boolean;
  onToggleAiAutoChat: () => void;
}

export default function AICommunicationPanel({
  robots,
  zones,
  messages,
  onSendMessage,
  isAiAutoChatActive,
  onToggleAiAutoChat,
}: Props) {
  const [promptInput, setPromptInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendDirective = (directiveText: string) => {
    if (!directiveText.trim()) return;
    setIsProcessing(true);

    const results = processOperatorAIDirective(directiveText, robots, zones);

    // Simulate multi-agent conversational cadence
    results.forEach((res, i) => {
      setTimeout(() => {
        const badgeMap: Record<string, 'STATUS' | 'LOGISTICS' | 'CONFIRM' | 'ALERT'> = {
          DIRECTIVE: 'STATUS',
          NEGOTIATION: 'LOGISTICS',
          LOGISTICS: 'LOGISTICS',
          COLLISION_AVOIDANCE: 'ALERT',
          ENERGY_HANDOVER: 'ALERT',
          STATUS: 'CONFIRM',
        };

        onSendMessage({
          from: res.from,
          to: res.to,
          content: res.message,
          badge: badgeMap[res.type] || 'LOGISTICS',
        });

        if (i === results.length - 1) {
          setIsProcessing(false);
        }
      }, i * 750);
    });

    setPromptInput('');
  };

  const quickPrompts = [
    'Prioritize water transport between Zone A and Zone C',
    'Conduct fleet battery audit and initiate RTB for low cells',
    'Scan for corridor deadlocks around Hazard Zone B',
    'Re-auction open task orders across idle robots',
  ];

  return (
    <div className="glass" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Autonomous AI Inter-Robot Communication Engine</span>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                P2P NLP ACTIVE
              </span>
            </h3>
            <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
              Decentralized multi-agent cognitive reasoning · Contract Net negotiation · Spatial collision deconfliction
            </p>
          </div>
        </div>

        {/* Auto Chat Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Autonomous AI Dialogue:</span>
          <button
            onClick={onToggleAiAutoChat}
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              border: isAiAutoChatActive ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(255, 255, 255, 0.15)',
              background: isAiAutoChatActive
                ? 'linear-gradient(180deg, rgba(34, 197, 94, 0.35) 0%, rgba(21, 128, 61, 0.25) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              boxShadow: isAiAutoChatActive
                ? 'inset 0 1px 1.5px rgba(255, 255, 255, 0.5), 0 3px 12px rgba(34, 197, 94, 0.3)'
                : 'inset 0 1px 1px rgba(255, 255, 255, 0.15)',
              color: isAiAutoChatActive ? '#ffffff' : '#94a3b8',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isAiAutoChatActive ? '#4ade80' : '#64748b', boxShadow: isAiAutoChatActive ? '0 0 6px #4ade80' : 'none' }} />
            {isAiAutoChatActive ? 'AI Chat Active' : 'AI Chat Paused'}
          </button>
        </div>
      </div>

      {/* Operator Directive Input Box */}
      <div style={{ background: '#070a0f', borderRadius: 16, padding: 14, border: '1px solid rgba(56, 189, 248, 0.16)' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>
          Dispatch Operator Directive to Fleet AI Agents
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendDirective(promptInput);
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            type="text"
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            placeholder="Type directive (e.g. 'Robot 1 and Robot 5, fast-track water transfer to Zone C')..."
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 9999,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !promptInput.trim()}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 22px', fontSize: 12.5, borderRadius: 9999 }}
          >
            {isProcessing ? 'Processing...' : 'Broadcast'}
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {quickPrompts.map(qp => (
            <button
              key={qp}
              type="button"
              onClick={() => handleSendDirective(qp)}
              disabled={isProcessing}
              style={{
                background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                color: '#bae6fd',
                padding: '5px 12px',
                borderRadius: 9999,
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {qp}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
