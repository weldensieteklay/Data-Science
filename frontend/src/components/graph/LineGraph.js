import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Box } from '@mui/material';

const TimeSeriesChart = ({ data, dateName, targetVariables }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null); // Ref to store the chart instance

  useEffect(() => {
    if (data && data.length > 0 && chartRef.current) {
      let sortedData = [...data].sort((a, b) => new Date(a[dateName]) - new Date(b[dateName]));
      const dates = sortedData.map(item => item[dateName]);
      const datasets = targetVariables.map((variable, index) => ({
        label: variable,
        data: sortedData.map(item => item[variable]),
        borderColor: getRandomColor(index),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 1
      }));

      const ctx = chartRef.current.getContext('2d');

      // Destroy any existing chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Create a new chart instance
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: datasets
        },
        options: {
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'day'
              },
              scaleLabel: {
                display: true,
                labelString: 'Date'
              }
            }],
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Value'
              }
            }]
          }
        }
      });
    }
  }, [data, dateName, targetVariables]);

  const getRandomColor = (index) => {
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)'
    ];

    return colors[index % colors.length];
  };

  return (
    <Box sx={{marginLeft: '50px', marginRight: '50px'}}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default TimeSeriesChart;
