"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, X } from "lucide-react";

interface VoiceAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  onStartEngine?: () => void;
  onStopEngine?: () => void;
}

export default function VoiceAssistantOverlay({ 
  isOpen, 
  onClose, 
  transcript,
  onStartEngine,
  onStopEngine
}: VoiceAssistantOverlayProps) {
  const [isEngineStarted, setIsEngineStarted] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetVolumeRef = useRef(0);
  const currentVolumeRef = useRef(0);

  const playTingleChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1975.53, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.error("Chime blocked", e);
    }
  };

  const startWaveformAnimation = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Procedural Voice Simulation (Bypasses Hardware Locks)
      if (isEngineStarted) {
        // Randomly fluctuate target volume to mimic natural human speech cadences
        if (Math.random() > 0.8) {
          targetVolumeRef.current = Math.random() * 2.5 + 0.5;
        }
      } else {
        targetVolumeRef.current = 0;
      }

      // Smooth the transition so it looks like fluid audio
      currentVolumeRef.current += (targetVolumeRef.current - currentVolumeRef.current) * 0.15;

      const baseAmplitude = isEngineStarted ? 5 + (currentVolumeRef.current * 12) : 1;
      phase += isEngineStarted ? 0.15 + (currentVolumeRef.current * 0.05) : 0.03;

      const waves = [
        { top: 2, color: "rgba(56, 189, 248, 0.8)", width: 2.5 },
        { top: -2, color: "rgba(59, 130, 246, 0.5)", width: 1.5 },
        { top: 0, color: "rgba(255, 255, 255, 0.9)", width: 3 }
      ];

      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = wave.width;
        ctx.strokeStyle = wave.color;
        for (let x = 0; x < canvas.width; x++) {
          const angle = (x / canvas.width) * Math.PI * 2 * 1.2 + phase + wave.top;
          const y = canvas.height / 2 + Math.sin(angle) * baseAmplitude * Math.sin(x / canvas.width * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  // Spike the wave immediately when real speech text is detected
  useEffect(() => {
    if (transcript.trim()) {
      targetVolumeRef.current = 3;
    }
  }, [transcript]);

  const toggleListeningSession = () => {
    if (isEngineStarted) {
      if (onStopEngine) onStopEngine();
      setIsEngineStarted(false);
    } else {
      playTingleChime();
      setIsEngineStarted(true);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      startWaveformAnimation();
      if (onStartEngine) onStartEngine();
    }
  };

  const handleCloseEverything = () => {
    if (isEngineStarted && onStopEngine) onStopEngine();
    setIsEngineStarted(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      startWaveformAnimation();
    }
    // Nuclear Cleanup: Runs the millisecond the component unmounts or isOpen becomes false
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (isEngineStarted) {
        if (onStopEngine) onStopEngine();
        setIsEngineStarted(false);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm h-[480px] rounded-[32px] bg-gradient-to-b from-slate-900/80 to-blue-950/80 border border-white/10 backdrop-blur-2xl p-8 shadow-2xl flex flex-col items-center justify-between text-white overflow-hidden">
        <button onClick={handleCloseEverything} className="absolute top-5 right-5 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer z-10">
          <X className="w-4 h-4" />
        </button>
        <div className="w-full text-center text-xl font-normal text-slate-100 tracking-wide leading-relaxed px-4 mt-12 min-h-[100px] flex items-center justify-center">
          {transcript || "Hi Ishan, what's on your mind?"}
        </div>
        <div className="w-full h-24 flex items-center justify-center relative my-2">
          <canvas ref={canvasRef} width={320} height={96} className="w-full h-full opacity-90" />
        </div>
        <div className="w-full flex justify-center items-center pb-6 z-10">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleListeningSession();
            }} 
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer z-50 ${isEngineStarted ? 'bg-gradient-to-tr from-cyan-400 to-emerald-400 text-white ring-4 ring-cyan-400/30' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
          >
            <Mic className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
