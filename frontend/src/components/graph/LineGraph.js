import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Box, Button } from '@mui/material';
import jsPDF from 'jspdf';
import 'chartjs-plugin-datalabels'; // Import the plugin

const TimeSeriesChart = ({ data, dateName, targetVariables, stationary }) => {
  const [showDifference, setShowDifference] = useState(false);
  const chartRef1 = useRef(null);
  const chartInstanceRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartInstanceRef2 = useRef(null);

  const difference = (data, variable) => {
    return data.map((item, index) => {
      if (index === 0) return null;
      return item[variable] - data[index - 1][variable];
    }).filter(diff => diff !== null);
  }

  useEffect(() => {
    if (data && data.length > 0) {
      let sortedData = [...data].sort((a, b) => new Date(a[dateName]) - new Date(b[dateName]));
      const dates = sortedData.map(item => item[dateName]);

      const datasets = targetVariables.map((variable, index) => {
        const dataValues = showDifference && stationary.includes(variable) ? difference(sortedData, variable) : sortedData.map(item => item[variable]);

        return {
          label: variable,
          data: dataValues,
          borderColor: getRandomColor(index),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 1
        };
      });

      if (chartRef1.current && chartRef1.current.getContext) {
        if (chartInstanceRef1.current) {
          chartInstanceRef1.current.destroy();
        }
  
        chartInstanceRef1.current = new Chart(chartRef1.current.getContext('2d'), {
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
                  labelString: 'Date' // Set x-axis title
                }
              }],
              yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: targetVariables.length === 1 ? targetVariables[0] : 'Endogenous Variable'
                }
              }]
            },
            plugins: {
              datalabels: {
                display: false // Hide the data labels by default
              }
            }
          }
        });
  
        chartRef1.current.width = Math.max(600, sortedData.length * 30);
      }

      if (showDifference && chartRef2.current && chartRef2.current.getContext) {
        if (chartInstanceRef2.current) {
          chartInstanceRef2.current.destroy();
        }
  
        chartInstanceRef2.current = new Chart(chartRef2.current.getContext('2d'), {
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
                  labelString: 'Date' // Set x-axis title
                }
              }],
              yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: targetVariables.length === 1 ? targetVariables[0] : 'Endogenous Variable'
                }
              }]
            },
            plugins: {
              datalabels: {
                display: false // Hide the data labels by default
              }
            }
          }
        });
  
        chartRef2.current.width = Math.max(600, sortedData.length * 30);
      }
    }
  }, [data, dateName, targetVariables, stationary, showDifference]);

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

  const exportToPDF = () => {
    const chartCanvas = showDifference ? chartRef2.current : chartRef1.current;
    const chartImage = chartCanvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(chartImage);

    const maxWidth = 200;
    const maxHeight = 400;
    const aspectRatio = imgProps.width / imgProps.height;

    let pdfWidth = maxWidth;
    let pdfHeight = maxWidth / aspectRatio;

    if (pdfHeight > maxHeight) {
      pdfHeight = maxHeight;
      pdfWidth = maxHeight * aspectRatio;
    }

    const xPos = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
    const yPos = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
    pdf.addImage(chartImage, 'PNG', xPos, yPos, pdfWidth, pdfHeight);
    pdf.save('chart.pdf');
  };

  return (
    <Box sx={{ position: 'relative', marginLeft: '50px', marginRight: '50px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'right', marginTop: 2 }}>
        <Button onClick={exportToPDF} variant="contained" color="primary" sx={{marginRight: '2px'}}>Download as PDF</Button>
        <Button onClick={() => setShowDifference(!showDifference)} variant="contained" color="primary">Toggle Difference</Button>
      </Box>
      <Box sx={{ margin: 1 }}>
        <canvas ref={chartRef1} />
        {showDifference && <canvas ref={chartRef2} />}
      </Box>
    </Box>
  );
};

export default TimeSeriesChart;
