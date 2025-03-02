import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ScoreChart = ({ scores, subject }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!scores || scores.length === 0) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for Chart.js
    const labels = scores.map(s => `${s.year} ${s.session} ${s.paper}`);
    const data = scores.map(s => s.score);
    
    // Create chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Score (%)',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: `Score Progress for ${subject}`
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Score (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Papers'
            }
          }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [scores, subject]);

  if (!scores || scores.length === 0) {
    return <div className="text-center p-4 text-gray-500">No score data available for visualization</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default ScoreChart;
