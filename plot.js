var myerror = null;

function plotData(_stn) {
  Plotly.d3.csv(URL_pre + "RAPID/" + _stn + ".csv", function(err, rows) {
      // if(err & err.status==404){
      //   console.log("Data for this station not found");
      //   return
      // }
      function unpack(rows, key) {
        if (err) {
          Plotly.purge("tideplot1");
          Plotly.purge("tideplot2");
          $("#tideplot1").text("Real-time water level data for station " + _stn + " is not available. Tide tables and datum information are available on subsequent tabs.");
          // alert("Water Levels data for station number: " + _stn + " is missing");
        } else {
          $("#tideplot1").empty()
        }
        return rows.map(function(row) {
          return row[key];
        });
      }
      myerror = err;

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: 'Tidal prediction',
        x: unpack(rows, 'Time'),
        y: unpack(rows, 'Prediction'),
        line: {
          color: 'rgb(86, 180, 233)'
        }
      }

      var trace2 = {
        type: "scatter",
        mode: "lines",
        name: 'Tide gauge observation',
        x: unpack(rows, 'Time'),
        y: unpack(rows, 'Observation'),
        line: {
          color: 'rgb(213, 94, 0)'
        }
      }

      var trace3 = {
        type: "scatter",
        mode: "lines",
        name: 'Residual (observation minus prediction)',
        x: unpack(rows, 'Time'),
        y: unpack(rows, 'Residual'),
        line: {
          color: 'rgb(0, 158, 115)'
        }
      }


      var trace4 = {
        type: "scatter",
        mode: "lines",
        name: 'Extreme low (5%)',
        x: unpack(rows, 'Time'),
        y: unpack(rows, 'ExtremeLow'),
        line: {
          color: 'rgb(0, 0, 0)',
          dash: 'dashdot'
        }
      }

      var trace5 = {
        type: "scatter",
        mode: "lines",
        name: 'Extreme high (5%)',
        x: unpack(rows, 'Time'),
        y: unpack(rows, 'ExtremeHigh'),
        line: {
          color: 'rgb(0, 0, 0)',
          dash: 'dashdot'
        }
      }

      var data123 = [trace1, trace2, trace3, trace4, trace5];
      var data3 = [trace3];

      var layout123 = {
        title: 'Stn:' + _stn,
        width: 1050,
        height: 450,
        autoresize: true,
        xaxis: {
          autorange: true,
          rangeselector: {
            buttons: [{
                count: 7,
                label: '1w',
                step: 'day',
                stepmode: 'backward'
              },
              {
                count: 1,
                label: '1m',
                step: 'month',
                stepmode: 'backward'
              },
              {
                step: 'all'
              }
            ],
            x: 0,
            y: 1.1

          },
          rangeslider: {},
          type: 'date'
        },
        yaxis: {
          title: 'Relative water level (cm, MLLW)',
          autorange: true,
          range: [0, 1000],
          type: 'linear',
        },
        legend: {
          xanchor: "center",
          yanchor: "top",
          "orientation": "h",
          x: 0.5,
          y: 1.1,
        },
        margin: {
          l: 70,
          r: 0, //105
          b: 0,
          t: 80,
          pad: 3
        },
      };

      var layout3 = {
        showlegend: true,
        title: 'Residual (observation minus prediction)',
        width: 1050,
        height: 450,
        autoresize: true,
        xaxis: {
          autorange: true,
          rangeselector: {
            buttons: [{
                count: 7,
                label: '1w',
                step: 'day',
                stepmode: 'backward'
              },
              {
                count: 1,
                label: '1m',
                step: 'month',
                stepmode: 'backward'
              },
              {
                step: 'all'
              }
            ],
            x: 0,
            y: 1.1
          },
          rangeslider: {},
          type: 'date'
        },
        yaxis: {
          title: 'Relative water level (cm)',
          autorange: true,
          range: [0, 1000],
          type: 'linear'
        },
        legend: {
          xanchor: "center",
          yanchor: "top",
          "orientation": "h",
          x: 0.5,
          y: 1.1,
        },
        margin: {
          l: 70,
          r: 0, //105
          b: 0,
          t: 100,
          pad: 3
        },
      };

      Plotly.newPlot('tideplot1', data123, layout123, {
        displayModeBar: false
      });

      Plotly.newPlot('tideplot2', data3, layout3, {
        displayModeBar: false
      });


    }
    // , function(error) {
    //   myerror = error;
    //   console.log(error);
    //   alert("Data for station number: "+_stn+" is missing");
    // }
  )

};
