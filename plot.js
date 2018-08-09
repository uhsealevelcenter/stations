DEFAULT_VALUES = {
  unit: "Metric",
  tzone: "GMT",
  datum: "MLLW"
}

function plotData(_stn) {
  Plotly.d3.csv(URL_pre + "RAPID/" + _stn + ".csv", function(err, rows) {
      // if(err & err.status==404){
      //   console.log("Data for this station not found");
      //   return
      // }
      function unpack(rows, key, unit, datum) {
        console.log("Called");
        if (err) {
          Plotly.purge("tideplot1");
          Plotly.purge("tideplot2");
          $("#tideplot1").text("Real-time water level data for station " + _stn + " is not available. Tide tables and datum information are available on subsequent tabs.");
          // alert("Water Levels data for station number: " + _stn + " is missing");
          $("#product_desc").hide()
        } else {
          $("#tideplot1").empty();
        }
        return rows.map(function(row) {
          if (row[key] == "")
            row[key] = "NaN";
          if (key === "Time") {
            return row[key] + ":00";
          } else {
            if (unit.innerHTML === DEFAULT_VALUES.unit && datum.innerHTML === DEFAULT_VALUES.datum) {
              //Do nothing
              // console.log("NO conversion on station change");
              return row[key];
            } else if (unit.innerHTML != DEFAULT_VALUES.unit && datum.innerHTML === DEFAULT_VALUES.datum) {
              //convert units to english with default datum
              // console.log("Convert only units on station change");
              return row[key] * 0.0328084;
            } else if (unit.innerHTML === DEFAULT_VALUES.unit && datum.innerHTML != DEFAULT_VALUES.datum) {
              // console.log("Convert only datum on station change");
              return row[key];
            } else {
              // console.log("Convert both units and datum on station change");
                return row[key] * 0.0328084;
            }
          }




          // if (key === "Time")
          //   return row[key] + ":00";
          // else
          //   return row[key];
        });
      }

      function convert(rows, key, factor) {
        return rows.map(function(row) {
          {
            // when encounter an empty cell in a csv file give it a NaN
            // If not done, the value is read as 0
            if (row[key] == "")
              row[key] = "NaN";
            return row[key] * factor;
          }
        });
      }
      var currentUnit = document.getElementById("unitToggle");
      var currentDatum = document.getElementById("datumToggle");
      var yLabel1,yLabel2 = "";
      // There is no need to unpack time vector for every tracer
      // because it is the same for each tracer
      timeVector = unpack(rows, 'Time', currentUnit, currentDatum);
      if (currentUnit.innerHTML==="Metric")
        {
          yLabel1='Relative water level (cm, MLLW)';
          yLabel2='Relative water level (cm)';
        }
        else {
          yLabel1='Relative water level (ft, MLLW)';
          yLabel2='Relative water level (ft)';
        }
      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: 'Tidal prediction',
        x: timeVector,
        y: unpack(rows, 'Prediction', currentUnit, currentDatum),
        line: {
          color: 'rgb(86, 180, 233)'
        }
      }
      // console.log("Time "+ unpack(rows, 'Time'));
      // console.log("type of time/date "+ typeof (unpack(rows, 'Time')[0]));
      // console.log("T_ZONE "+ unpack(rows, 'time_zone')[0]);
      var trace2 = {
        type: "scatter",
        mode: "lines",
        name: 'Tide gauge observation',
        x: timeVector,
        y: unpack(rows, 'Observation', currentUnit, currentDatum),
        line: {
          color: 'rgb(213, 94, 0)'
        }
      }

      var trace3 = {
        type: "scatter",
        mode: "lines",
        name: 'Residual (observation minus tide)',
        x: timeVector,
        y: unpack(rows, 'Residual', currentUnit, currentDatum),
        line: {
          color: 'rgb(0, 158, 115)'
        }
      }


      var trace4 = {
        type: "scatter",
        mode: "lines",
        name: 'Extreme low (5%)',
        x: timeVector,
        y: unpack(rows, 'ExtremeLow', currentUnit, currentDatum),
        line: {
          color: 'rgb(0, 0, 0)',
          dash: 'dashdot'
        }
      }

      var trace5 = {
        type: "scatter",
        mode: "lines",
        name: 'Extreme high (5%)',
        x: timeVector,
        y: unpack(rows, 'ExtremeHigh', currentUnit, currentDatum),
        line: {
          color: 'rgb(0, 0, 0)',
          dash: 'dashdot'
        }
      }

      var data123 = [trace1, trace2, trace3, trace4, trace5];
      var data3 = [trace3];

      var layout123 = {
        // title: 'Stn:' + _stn,
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
          title: yLabel1,
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
        // title: 'Residual (observation minus prediction)',
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
          title: yLabel2,
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
      // console.log(rows[0]);
      Plotly.newPlot('tideplot1', data123, layout123, {
        displayModeBar: false
      });

      Plotly.newPlot('tideplot2', data3, layout3, {
        displayModeBar: false
      });
      $("#product_desc").show();
      // Dropdwon menu station change behavior

      // if ( currentUnit.innerHTML === DEFAULT_VALUES.unit && currentDatum.innerHTML === DEFAULT_VALUES.datum) {
      //   //Do nothing
      //   console.log("NO conversion on station change");
      // } else if(currentUnit.innerHTML != DEFAULT_VALUES.unit && currentDatum.innerHTML === DEFAULT_VALUES.datum) {
      //   //convert units to english with default datum
      //   console.log("Convert only units on station change");
      //   updatePlot();
      // }else if (currentUnit.innerHTML === DEFAULT_VALUES.unit && currentDatum.innerHTML != DEFAULT_VALUES.datum) {
      //   console.log("Convert only datum on station change");
      // } else {
      //   console.log("Convert both units and datum on station change");
      //   updatePlot();
      // }

      // On button click station behavior
      $('.units button').unbind().click(function() {
        if (currentUnit.innerHTML === "Metric") {
          currentUnit.innerHTML = "English";
        } else if (currentUnit.innerHTML === "English") {
          currentUnit.innerHTML = "Metric";
        }
          updatePlot(currentUnit,currentDatum);
      });

      $('.datum button').unbind().click(function() {
        // console.log(currentDatum.innerHTML);
        if (currentDatum.innerHTML === "MLLW")
          currentDatum.innerHTML = "MHHW";
        else {
          currentDatum.innerHTML = "MLLW";
        }
      });

      function updatePlot(unit, datum) {
        var columns = ["Prediction", "Observation", "Residual", "ExtremeLow", "ExtremeHigh"];

        for (var i = 0; i < columns.length; i++) {
          var update = {
            y: [unpack(rows, columns[i], unit, datum)]
          };
          var layout_update = {
            yaxis: {
              title: 'Relative water level (ft, MLLW)',
              autorange: true,
              range: [0, 1000],
              type: 'linear',
            }
          };
          layout_update.yaxis.title = "Relative water level (ft, MLLW)";
          Plotly.update('tideplot1', update, layout_update, [i]);
          if (columns[i] === "Residual") {
            layout_update.yaxis.title = "Relative water level (ft)";
            Plotly.update('tideplot2', update, layout_update, [0]);
          }
        }
      }
    }
    // , function(error) {
    //   myerror = error;
    //   console.log(error);
    //   alert("Data for station number: "+_stn+" is missing");
    // }
  )

};
