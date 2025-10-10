import { useState } from 'react';
import jsPDF from 'jspdf';

interface ExportButtonProps {
  data: any;
  type: 'radar' | 'bar' | 'kpi';
}

// ✅ UNIVERSAL Export-knapp för ALLA diagramtyper
export const ExportButton = ({ data, type }: ExportButtonProps) => {
  const [isNamingDialogOpen, setIsNamingDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('kravtäckning-diagram');

  // Funktion för att rita radar-diagram
  const drawRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: any[],
    centerX: number,
    centerY: number,
    radius: number,
  ) => {
    const angleStep = (2 * Math.PI) / data.length;

    // Rita bakgrundsgrid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Rita koncentriska cirklar
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius / 5) * level;
      ctx.beginPath();
      ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Rita nivå-etiketter
      ctx.fillStyle = '#999999';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(level.toString(), centerX + levelRadius + 5, centerY);
    }

    // Rita axlar från centrum
    ctx.strokeStyle = '#cccccc';
    data.forEach((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Rita datalinjen
    ctx.strokeStyle = '#0ca590';
    ctx.fillStyle = 'rgba(12, 165, 144, 0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (item.score / 5) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Rita datapunkter
    ctx.fillStyle = '#0ca590';
    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const distance = (item.score / 5) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Rita etiketter
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    data.forEach((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const labelDistance = radius + 25;
      const x = centerX + Math.cos(angle) * labelDistance;
      const y = centerY + Math.sin(angle) * labelDistance;

      const subject = item.subject.length > 8 ? item.subject.substring(0, 8) + '...' : item.subject;
      ctx.fillText(`${subject} (${item.score.toFixed(1)})`, x, y);
    });
  };

  // Funktion för att rita stapeldiagram
  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: any[],
    startX: number,
    startY: number,
    width: number,
    height: number,
  ) => {
    const padding = 80;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / (data.length * 1.5);
    const maxValue = 5;

    // Rita bakgrundsgrid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Rita horisontella gridlinjer
    for (let i = 0; i <= 5; i++) {
      const y = startY + padding + (chartHeight / 5) * (5 - i);

      ctx.beginPath();
      ctx.moveTo(startX + padding, y);
      ctx.lineTo(startX + padding + chartWidth, y);
      ctx.stroke();

      // Rita y-axel etiketter
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(i.toString(), startX + padding - 5, y + 3);
    }

    // Rita staplar
    data.forEach((item, index) => {
      const barHeight = (item.score / maxValue) * chartHeight;
      const x =
        startX +
        padding +
        index * (chartWidth / data.length) +
        (chartWidth / data.length - barWidth) / 2;
      const y = startY + padding + chartHeight - barHeight;

      // ✅ ANVÄND SAMMA TEAL-FÄRG
      const fillColor = '#0ca590';

      // Rita stapen
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Rita stapelkant
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Rita etikett under stapen
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      const subject = item.subject.length > 8 ? item.subject.substring(0, 8) + '...' : item.subject;
      ctx.fillText(subject, x + barWidth / 2, startY + padding + chartHeight + 15);

      // Rita värde ovanför stapen
      ctx.fillStyle = fillColor;
      ctx.font = 'bold 12px Arial';
      ctx.fillText(item.score.toFixed(1), x + barWidth / 2, y - 5);
    });

    // Rita axlar
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;

    // X-axel
    ctx.beginPath();
    ctx.moveTo(startX + padding, startY + padding + chartHeight);
    ctx.lineTo(startX + padding + chartWidth, startY + padding + chartHeight);
    ctx.stroke();

    // Y-axel
    ctx.beginPath();
    ctx.moveTo(startX + padding, startY + padding);
    ctx.lineTo(startX + padding, startY + padding + chartHeight);
    ctx.stroke();

    // Axeletiketter
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Delområden', startX + width / 2, startY + height - 20);

    ctx.save();
    ctx.translate(startX + 20, startY + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Betyg (0-5)', 0, 0);
    ctx.restore();
  };

  // Funktion för att rita KPI-kort
  const drawKPICards = (
    ctx: CanvasRenderingContext2D,
    data: any,
    startX: number,
    startY: number,
    width: number,
    height: number,
  ) => {
    const cardWidth = 450;
    const cardHeight = 100;
    const cardMargin = 20;

    // Rita KPI-kort i grid
    const drawKPICard = (
      title: string,
      value: string,
      description: string,
      x: number,
      y: number,
      color: string = '#000000',
    ) => {
      // Kortbakgrund
      ctx.fillStyle = '#f8f9fa';
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, cardWidth, cardHeight);
      ctx.strokeRect(x, y, cardWidth, cardHeight);

      // Titel
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 15, y + 25);

      // Värde (med färg)
      ctx.fillStyle = color;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(value, x + 15, y + 60);

      // Beskrivning
      ctx.fillStyle = '#666666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(description, x + 15, y + 80);
    };

    // Rad 1: Totalt antal och Högsta betyg
    drawKPICard(
      'Totalt antal delområden',
      data.totalaDelomraden.toString(),
      'Antal bedömda områden',
      startX,
      startY,
      '#2563eb',
    );

    drawKPICard(
      'Högsta betyg',
      `${data.hogstaBetyg.toFixed(1)}/5`,
      'Bästa resultat',
      startX + cardWidth + cardMargin,
      startY,
      '#0ca590',
    );

    // Rad 2: Lägsta betyg och Genomsnittligt betyg
    drawKPICard(
      'Lägsta betyg',
      `${data.lagstaBetyg.toFixed(1)}/5`,
      'Lägsta resultat',
      startX,
      startY + cardHeight + cardMargin,
      '#0ca590',
    );

    drawKPICard(
      'Genomsnittligt betyg',
      `${data.genomsnittligBetyg.toFixed(1)}/5`,
      'Snittresultat',
      startX + cardWidth + cardMargin,
      startY + cardHeight + cardMargin,
      '#0ca590',
    );
  };

  // Funktion för att rita separatorstreck
  const drawSeparator = (ctx: CanvasRenderingContext2D, yPosition: number, canvasWidth: number) => {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, yPosition);
    ctx.lineTo(canvasWidth - 50, yPosition);
    ctx.stroke();
  };

  const handleExport = (customFileName?: string) => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      alert('Ingen data att exportera.');
      return;
    }

    const finalFileName = customFileName || fileName;

    // ✅ DYNAMISK CANVAS-HÖJD
    const baseHeight = type === 'kpi' ? 1200 : 1300;
    const additionalHeight = Array.isArray(data) ? data.length * 25 : 0;
    const totalHeight = baseHeight + additionalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Kunde inte skapa export. Försök igen.');
      return;
    }

    // ✅ BAKGRUND
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let currentY = 50;

    // ✅ DEL 1: RUBRIK
    const titles = {
      radar: 'KRAVTÄCKNING - RADAR DIAGRAM',
      bar: 'KRAVTÄCKNING - STAPELDIAGRAM',
      kpi: 'KRAVTÄCKNING - KPI-ÖVERSIKT',
    };

    const descriptions = {
      radar: 'Sammanfattning av medelbetyg per delområde',
      bar: 'Sammanfattning av medelbetyg per delområde',
      kpi: 'Översikt av prestationsnyckeltal',
    };

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(titles[type], canvas.width / 2, currentY);

    currentY += 40;
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    ctx.fillText(descriptions[type], canvas.width / 2, currentY);

    currentY += 60;

    // ✅ SEPARATOR 1: Efter rubrik
    drawSeparator(ctx, currentY, canvas.width);
    currentY += 40;

    // ✅ DEL 2: DIAGRAM
    const chartWidth = 800;
    const chartHeight = 500;
    const chartStartX = (canvas.width - chartWidth) / 2;

    if (type === 'radar') {
      const centerX = canvas.width / 2;
      const radius = 180;
      const diagramCenterY = currentY + radius + 50;
      drawRadarChart(ctx, data, centerX, diagramCenterY, radius);
      currentY = diagramCenterY + radius + 50;
    } else if (type === 'bar') {
      drawBarChart(ctx, data, chartStartX, currentY, chartWidth, chartHeight);
      currentY += chartHeight + 80;
    } else if (type === 'kpi') {
      drawKPICards(ctx, data, chartStartX, currentY, chartWidth, 300);
      currentY += 300 + 80;
    }

    // ✅ SEPARATOR 2: Efter diagram
    drawSeparator(ctx, currentY, canvas.width);
    currentY += 40;

    // ✅ DEL 3: SAMMANFATTNING
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SAMMANFATTNING AV DATAN', canvas.width / 2, currentY);
    currentY += 50;

    // Grundinformation
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    ctx.fillText(
      `Genererad: ${new Date().toLocaleDateString('sv-SE')}`,
      canvas.width / 2,
      currentY,
    );
    currentY += 30;

    const itemCount = Array.isArray(data) ? data.length : data.totalaDelomraden;
    ctx.fillText(`Antal delområden: ${itemCount}`, canvas.width / 2, currentY);
    currentY += 40;

    // Genomsnitt - ✅ ANVÄND TEAL-FÄRG
    let averageScore = 0;
    if (Array.isArray(data)) {
      averageScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;
    } else {
      averageScore = data.genomsnittligBetyg;
    }

    ctx.fillStyle = '#0ca590';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`Genomsnittligt betyg: ${averageScore.toFixed(1)}/5`, canvas.width / 2, currentY);
    currentY += 60;

    // ✅ SEPARATOR 3: Efter sammanfattning
    drawSeparator(ctx, currentY, canvas.width);
    currentY += 40;

    // ✅ DEL 4: DETAILERAD ÖVERSIKT (endast för radar och bar)
    if (type !== 'kpi' && Array.isArray(data)) {
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DETALJERAD ÖVERSIKT', canvas.width / 2, currentY);
      currentY += 50;

      ctx.font = '16px Arial';
      const maxSubjectLength = Math.max(...data.map((item) => item.subject.length));
      const listWidth = maxSubjectLength * 10 + 100;
      const listStartX = (canvas.width - listWidth) / 2;

      data.forEach((item) => {
        if (currentY > canvas.height - 50) return;

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.subject}:`, listStartX, currentY);

        ctx.fillStyle = '#0ca590';
        ctx.textAlign = 'right';
        ctx.fillText(`${item.score.toFixed(1)}/5`, listStartX + listWidth - 50, currentY);

        currentY += 25;
      });
    }

    // ✅ SKAPA PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    const imgAspectRatio = canvas.height / canvas.width;
    const pdfImgWidth = pdfPageWidth - 40;
    const pdfImgHeight = pdfImgWidth * imgAspectRatio;

    const xPosition = (pdfPageWidth - pdfImgWidth) / 2;
    pdf.addImage(imgData, 'PNG', xPosition, 20, pdfImgWidth, pdfImgHeight);

    pdf.save(`${finalFileName}.pdf`);

    if (customFileName) {
      setIsNamingDialogOpen(false);
    }
  };

  const handleOpenNamingDialog = () => {
    const date = new Date().toLocaleDateString('sv-SE').replace(/-/g, '');

    let avgScore = 0;
    if (Array.isArray(data)) {
      avgScore = data.reduce((sum, item) => sum + item.score, 0) / data.length;
    } else {
      avgScore = data.genomsnittligBetyg;
    }

    const typeNames = {
      radar: 'radardiagram',
      bar: 'stapeldiagram',
      kpi: 'kpi',
    };

    setFileName(`kravtäckning-${typeNames[type]}-${date}-${avgScore.toFixed(1)}`);
    setIsNamingDialogOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenNamingDialog}
        className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'
      >
        📊 Exportera PDF
      </button>

      {/* Dialogruta för filnamn */}
      {isNamingDialogOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-bold mb-4'>Namnge PDF-filen</h3>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray_700 mb-2'>Filnamn:</label>
              <input
                type='text'
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Ange filnamn...'
                autoFocus
              />
              <p className='text-xs text-gray-500 mt-1'>
                Filen sparas som: <strong>{fileName}.pdf</strong>
              </p>
            </div>

            <div className='flex justify-end space-x-2'>
              <button
                onClick={() => setIsNamingDialogOpen(false)}
                className='px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50'
              >
                Avbryt
              </button>
              <button
                onClick={() => handleExport(fileName)}
                className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700'
              >
                Exportera PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
