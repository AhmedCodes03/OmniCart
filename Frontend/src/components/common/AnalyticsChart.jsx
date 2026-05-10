import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsChart({ type = 'line', data, options = {}, height = 300 }) {
  const [themeColors, setThemeColors] = useState({ text: '#94a3b8', grid: 'rgba(148, 163, 184, 0.1)' });

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setThemeColors({
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      tooltipBg: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      tooltipText: isDark ? '#f8fafc' : '#0f172a'
    });
  }, []);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type !== 'line',
        position: 'top',
        align: 'end',
        labels: {
          color: themeColors.text,
          font: { family: 'Outfit, sans-serif', weight: '700', size: 10 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: themeColors.tooltipBg,
        titleColor: themeColors.tooltipText,
        bodyColor: themeColors.tooltipText,
        titleFont: { family: 'Outfit, sans-serif', weight: '800', size: 14 },
        bodyFont: { family: 'Outfit, sans-serif', weight: '500', size: 12 },
        padding: 16,
        cornerRadius: 16,
        displayColors: true,
        borderColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        display: type !== 'doughnut',
        grid: { display: false },
        ticks: { 
          color: themeColors.text,
          font: { family: 'Outfit, sans-serif', weight: '600', size: 10 }
        },
      },
      y: {
        display: type !== 'doughnut',
        grid: { color: themeColors.grid, drawBorder: false },
        ticks: { 
          color: themeColors.text,
          font: { family: 'Outfit, sans-serif', weight: '600', size: 10 },
          padding: 10
        },
      },
    },
    ...options,
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
  }[type] || Line;

  return (
    <div style={{ height }} className="relative">
      <ChartComponent data={data} options={defaultOptions} />
    </div>
  );
}
