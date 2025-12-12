import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  stream, 
  isActive, 
  color = '#6366f1' // Indigo-500 default
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    // Initialize Audio Context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    // Create Analyser
    if (!analyserRef.current) {
       analyserRef.current = ctx.createAnalyser();
       analyserRef.current.fftSize = 64; // Small size for simple bars
       analyserRef.current.smoothingTimeConstant = 0.5;
    }
    const analyser = analyserRef.current;

    // Create Source
    try {
        if (sourceRef.current) {
            sourceRef.current.disconnect();
        }
        sourceRef.current = ctx.createMediaStreamSource(stream);
        sourceRef.current.connect(analyser);
    } catch (e) {
        console.error("Error creating audio source for visualizer", e);
        return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) return;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2; // Scale down

        // Draw bar
        canvasCtx.fillStyle = color;
        // Rounded caps aesthetic
        drawRoundedRect(canvasCtx, x, canvas.height - barHeight, barWidth - 2, barHeight, 2);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
          sourceRef.current.disconnect();
      }
    };
  }, [stream, isActive, color]);

  // Helper for rounded bars
  function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
      if (height <= 0) return;
      if (height < radius) radius = height;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={100} 
      height={30} 
      className="w-24 h-8"
    />
  );
};