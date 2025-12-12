import React, { useState, useRef, useEffect } from 'react';

interface DraggableVideoProps {
  children: React.ReactNode;
  className?: string;
}

export const DraggableVideo: React.FC<DraggableVideoProps> = ({ children, className }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Initial position (bottom right)
  useEffect(() => {
    // We let CSS handle initial placement, but JS takes over on drag
    // Setting initial state to null/undefined lets CSS rule, 
    // but here we just render and wait for interaction.
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    
    // Prevent default browser dragging of images/video
    e.preventDefault();
    
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setIsDragging(true);
    dragRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    e.preventDefault();

    const parent = dragRef.current.offsetParent as HTMLElement;
    if (!parent) return;

    // Calculate new position relative to parent
    let newX = e.clientX - parent.getBoundingClientRect().left - offsetRef.current.x;
    let newY = e.clientY - parent.getBoundingClientRect().top - offsetRef.current.y;

    // Boundaries
    const maxX = parent.clientWidth - dragRef.current.clientWidth;
    const maxY = parent.clientHeight - dragRef.current.clientHeight;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (dragRef.current) {
        dragRef.current.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={dragRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        // If we haven't dragged yet, use CSS classes (passed in className).
        // If we have dragged, use inline styles.
        left: isDragging || position.x !== 0 ? position.x : undefined,
        top: isDragging || position.y !== 0 ? position.y : undefined,
        // Remove bottom/right if we are controlling via top/left
        bottom: isDragging || position.x !== 0 ? 'auto' : undefined,
        right: isDragging || position.x !== 0 ? 'auto' : undefined,
        touchAction: 'none', // Crucial for mobile drag
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className={`${className} ${isDragging ? 'scale-105 shadow-2xl z-50' : 'z-20'} transition-transform`}
    >
      {children}
    </div>
  );
};