import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface KPICardsProps {
  data: {
    totalaDelomraden: number;
    hogstaBetyg: number;
    lagstaBetyg: number;
    genomsnittligBetyg: number;
    fordelning: {
      hog: number;
      medel: number;
      lag: number;
    };
  };
}

const getColorClass = (score: number) => {
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

// ✅ Färger för PieChart (BEHÅLL denna)
const FORDELNING_FARGER = ['#4CAF50', '#FFC107', '#F44336'];

// ✅ TA BORT denna rad eftersom den inte används:
// const FORDELNING_ETIKETTER = ['Höga (4-5)', 'Medel (3-4)', 'Låga (0-3)'];

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const { totalaDelomraden, hogstaBetyg, lagstaBetyg, genomsnittligBetyg, fordelning } = data;

  // ✅ Data för PieChart
  const fordelningData = [
    { name: 'Höga (4-5)', value: fordelning.hog },
    { name: 'Medel (3-4)', value: fordelning.medel },
    { name: 'Låga (0-3)', value: fordelning.lag },
  ];

  return (
    <div className='space-y-6'>
      {/* ✅ Topprad med viktiga KPI:er */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='shadow-lg'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-semibold'>Totalt antal delområden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-blue-600'>{totalaDelomraden}</div>
            <p className='text-sm text-muted-foreground mt-1'>Antal bedömda områden</p>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-semibold'>Högsta betyg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getColorClass(hogstaBetyg)}`}>
              {hogstaBetyg.toFixed(1)}/5
            </div>
            <p className='text-sm text-muted-foreground mt-1'>Bästa resultat</p>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-semibold'>Lägsta betyg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getColorClass(lagstaBetyg)}`}>
              {lagstaBetyg.toFixed(1)}/5
            </div>
            <p className='text-sm text-muted-foreground mt-1'>Lägsta resultat</p>
          </CardContent>
        </Card>

        <Card className='shadow-lg'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg font-semibold'>Genomsnittligt betyg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getColorClass(genomsnittligBetyg)}`}>
              {genomsnittligBetyg.toFixed(1)}/5
            </div>
            <p className='text-sm text-muted-foreground mt-1'>Snittresultat</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ PieChart för fördelning */}
      <Card className='shadow-lg'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold'>Fördelning av betyg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row items-center gap-8'>
            <div className='w-full md:w-1/2 h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={fordelningData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey='value'
                  >
                    {fordelningData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={FORDELNING_FARGER[index]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className='w-full md:w-1/2 space-y-4'>
              {fordelningData.map((item, index) => (
                <div key={item.name} className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div
                      className='w-4 h-4 rounded-full mr-3'
                      style={{ backgroundColor: FORDELNING_FARGER[index] }}
                    ></div>
                    <span className='font-medium'>{item.name}</span>
                  </div>
                  <div className='text-right'>
                    <span className='font-bold'>{item.value}</span>
                    <span className='text-muted-foreground text-sm ml-2'>
                      ({((item.value / totalaDelomraden) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
