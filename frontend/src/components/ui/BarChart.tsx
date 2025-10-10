import React, { useState } from 'react';
import {
  BarChart as BC,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: { subject: string; score: number }[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload?: { subject: string } }>;
  label?: string;
}

// ✅ Färgfunktion baserad på betyg (samma som RadarChart)
const getFillColor = (score: number) => {
  if (score >= 4) return '#4CAF50';
  if (score >= 3) return '#FFC107';
  return '#F44336';
};

export const BarChart = ({ data }: BarChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ✅ Beräkna genomsnittligt betyg för information
  const averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;

  // ✅ Anpassa etiketter för bättre läsbarhet
  const formattedData = data.map((item) => ({
    ...item,
    subject: item.subject.length > 10 ? `${item.subject.substring(0, 10)}...` : item.subject,
  }));

  // ✅ Custom Tooltip Component (samma som RadarChart)
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const color = getFillColor(score);

      return (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: `2px solid ${color}`,
            borderRadius: '5px',
            padding: '10px',
            fontSize: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
        >
          <p
            style={{ margin: 0, fontWeight: 'bold' }}
          >{`Del: ${label || payload[0]?.payload?.subject || ''}`}</p>
          <p style={{ margin: '5px 0 0 0', color: color, fontWeight: 'bold' }}>
            {`Betyg: ${payload[0].value.toFixed(1)}/5`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <ResponsiveContainer>
        <BC
          data={formattedData}
          onMouseLeave={() => setHoveredIndex(null)} // ✅ Återställ vid mouseleave
        >
          <CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
          <XAxis dataKey='subject' tick={{ fontSize: 10, fill: '#333', fontWeight: 'bold' }} />
          <YAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: '#666' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey='score'
            fill='#0ca590' // ✅ Företagets teal-färg som standard
            // ✅ Anpassa färg baserat på hover
            shape={(props: any) => {
              const { index, score, ...rest } = props;
              const isHovered = hoveredIndex === index;
              const fillColor = isHovered ? getFillColor(score) : '#0ca590'; // ✅ Teal normally, betygsfärg on hover

              return (
                <rect
                  {...rest}
                  fill={fillColor}
                  stroke={isHovered ? '#fff' : 'none'} // ✅ Vit kant vid hover
                  strokeWidth={isHovered ? 2 : 0}
                  style={{
                    transition: 'all 0.2s ease',
                    cursor: 'pointer', // ✅ Visa att den är interaktiv
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            }}
          />
        </BC>
      </ResponsiveContainer>

      {/* ✅ Färgförklaring (samma som RadarChart) */}
      <div
        style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 15px',
          borderRadius: '5px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ color: '#4CAF50', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              backgroundColor: '#4CAF50',
              borderRadius: '50%',
              marginRight: '5px',
            }}
          ></span>
          Högt (4-5)
        </span>
        <span style={{ color: '#FFC107', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              backgroundColor: '#FFC107',
              borderRadius: '50%',
              marginRight: '5px',
            }}
          ></span>
          Medel (3-4)
        </span>
        <span style={{ color: '#F44336', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              backgroundColor: '#F44336',
              borderRadius: '50%',
              marginRight: '5px',
            }}
          ></span>
          Lågt (0-3)
        </span>
      </div>

      {/* ✅ Visa genomsnittsbetyget med rätt färg */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
          color: getFillColor(averageScore),
          border: `2px solid ${getFillColor(averageScore)}`,
        }}
      >
        Genomsnitt: {averageScore.toFixed(1)}/5
      </div>
    </div>
  );
};
