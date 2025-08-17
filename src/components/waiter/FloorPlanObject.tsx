
import React from 'react';
import { cn } from '@/lib/utils';

interface FloorPlanObjectProps {
  type: 'table' | 'plant' | 'bar' | string;
  shape?: 'round' | 'square';
  seats?: number;
  name?: string;
  width?: number;
  height?: number;
}

const Chair = ({ angle, distance }: { angle: number; distance: number }) => {
  const x = Math.cos(angle * Math.PI / 180) * distance;
  const y = Math.sin(angle * Math.PI / 180) * distance;
  return (
    <rect 
      x={-10 + x} 
      y={-10 + y} 
      width="20" 
      height="20" 
      rx="4" 
      className="fill-current text-gray-400" 
      transform={`rotate(${angle + 90} ${x} ${y})`}
    />
  );
};


export const FloorPlanObject: React.FC<FloorPlanObjectProps> = ({ type, shape, seats, name, width, height }) => {
  if (type === 'table') {
    const tableSize = 80;
    const isRound = shape === 'round';
    
    let chairPositions: { angle: number; distance: number }[] = [];
    if (seats) {
      const angleStep = 360 / seats;
      for (let i = 0; i < seats; i++) {
        chairPositions.push({ angle: i * angleStep, distance: tableSize / 2 + 10 });
      }
    }

    return (
      <div className="relative" style={{ width: `${tableSize + 40}px`, height: `${tableSize + 40}px`}}>
        <svg viewBox="-65 -65 130 130" className="w-full h-full">
          <g>
            {chairPositions.map((pos, i) => <Chair key={i} {...pos} />)}
            {isRound ? (
              <circle cx="0" cy="0" r={tableSize/2} className="fill-current text-gray-700 stroke-gray-500 stroke-2" />
            ) : (
              <rect x={-tableSize/2} y={-tableSize/2} width={tableSize} height={tableSize} rx="8" className="fill-current text-gray-700 stroke-gray-500 stroke-2" />
            )}
            <text x="0" y="0" textAnchor="middle" dy=".3em" className="fill-white font-bold text-lg">{name}</text>
          </g>
        </svg>
      </div>
    );
  }

  if (type === 'plant') {
     return (
        <div data-ai-hint="plant pot">
            <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
                <circle cx="30" cy="30" r="28" className="fill-current text-gray-800" />
                <path d="M30 20 Q 35 10, 40 20" stroke="green" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 20 Q 25 10, 20 20" stroke="green" fill="none" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 20 Q 30 10, 35 25" stroke="green" fill="none" strokeWidth="3" strokeLinecap="round" />
                 <path d="M30 20 Q 30 10, 25 25" stroke="green" fill="none" strokeWidth="3" strokeLinecap="round" />
            </svg>
        </div>
     );
  }
  
  if (type === 'bar') {
      return (
        <div data-ai-hint="bar counter">
            <svg width={width || 200} height={height || 60} viewBox={`0 0 ${width || 200} ${height || 60}`}>
                <rect x="0" y="0" width={width || 200} height={height || 60} rx="10" className="fill-current text-gray-700 stroke-gray-500 stroke-2" />
                <text x={(width || 200)/2} y={(height || 60)/2} textAnchor="middle" dy=".3em" className="fill-white font-bold text-lg">BAR</text>
            </svg>
        </div>
      )
  }

  return <div className="w-10 h-10 bg-red-500">?</div>;
};

