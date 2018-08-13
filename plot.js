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
      function unpack(rows, key, unit, datum, ml, mh, lst, tz) {
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
            if (tz.innerHTML !== DEFAULT_VALUES.tzone) {
              // The file that is being loaded is not in ISO format. Adding :00Z to hours for GMT converts to ISO so that we can manipualte the date later
              // Don't add :00Z if it is already there
              if (!row[key].includes(":"))
                row[key] = row[key] + ":00Z";
              if (row[key].includes(" "))
                row[key]=row[key].replace(" ", "T");
              var date = new Date(row[key]);
              date.setHours(date.getHours() + lst);
              return date.toISOString();
            } else
              return row[key];
          }
          // if seeking datum or time zone value return the value so the "else" portion is not executed
          if (key === "MHHW_NTDE" || key === "MLLW_NTDE" || key === "time_zone") {
            return row[key];
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
              return (row[key] * 1 + (ml - mh));
            } else {
              // console.log("Convert both units and datum on station change");
              return (row[key] * 1 + (ml - mh)) * 0.0328084;
            }
          }

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
      var currentTZ = document.getElementById("timeToggle");

      var unitYlabel = getLabels(currentUnit, currentDatum).unit;
      var datumYlabel = getLabels(currentUnit, currentDatum).datum;
      var yLabel1 = 'Relative water level (' + unitYlabel + ', ' + datumYlabel + ')';
      var yLabel2 = 'Relative water level (' + unitYlabel + ')';


      var MLLW = parseFloat(unpack(rows, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
      var MHHW = parseFloat(unpack(rows, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
      var LST = parseFloat(unpack(rows, 'time_zone', currentUnit, currentDatum)[0]);

      var currentTZ = document.getElementById("timeToggle");
      var xLabel = "Time/Date " + '(' + currentTZ.innerHTML + ')';

      // There is no need to unpack time vector for every tracer
      // because it is the same for each tracer
      var timeVector = unpack(rows, 'Time', currentUnit, currentDatum, MLLW, MHHW, LST, currentTZ);
      console.log(LST);

      var trace1 = {
        type: "scatter",
        mode: "lines",
        name: 'Tidal prediction',
        x: timeVector,
        y: unpack(rows, 'Prediction', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: 'rgb(86, 180, 233)'
        }
      }

      // console.log("Time "+ unpack(rows, 'Time'));
      // console.log("type of time/date "+ typeof (unpack(rows, 'Time')[0]));
      // console.log("T_ZONE "+ unpack(rows, 'LST')[0]);
      var trace2 = {
        type: "scatter",
        mode: "lines",
        name: 'Tide gauge observation',
        x: timeVector,
        y: unpack(rows, 'Observation', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: 'rgb(213, 94, 0)'
        }
      }

      var trace3 = {
        type: "scatter",
        mode: "lines",
        name: 'Residual (observation minus tide)',
        x: timeVector,
        y: unpack(rows, 'Residual', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: 'rgb(0, 158, 115)'
        }
      }


      var trace4 = {
        type: "scatter",
        mode: "lines",
        name: 'Extreme low (5%)',
        x: timeVector,
        y: unpack(rows, 'ExtremeLow', currentUnit, currentDatum, MLLW, MHHW, LST),
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
        y: unpack(rows, 'ExtremeHigh', currentUnit, currentDatum, MLLW, MHHW, LST),
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
          title: xLabel,
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
          b: 40,
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
          title: xLabel,
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
          b: 40,
          t: 60,
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

      // On button click station behavior

      $("#unitToggle").off().on('click', function() {

        if (currentUnit.innerHTML === "Metric") {
          $("#unitToggle").attr('tooltip', "Change to Metric");
          currentUnit.innerHTML = "English";
        } else if (currentUnit.innerHTML === "English") {
          currentUnit.innerHTML = "Metric";
          $("#unitToggle").attr('tooltip', "Change to English");
        }
        updatePlotData(currentUnit, currentDatum);
      });

      $('#datumToggle').off().on('click', function() {
        // console.log(currentDatum.innerHTML);
        if (currentDatum.innerHTML === "MLLW") {
          currentDatum.innerHTML = "MHHW";
          $("#datumToggle").attr('tooltip', "Change to MLLW");
        } else {
          currentDatum.innerHTML = "MLLW";
          $("#datumToggle").attr('tooltip', "Change to MHHW");
        }
        updatePlotData(currentUnit, currentDatum);
      });

      $('#timeToggle').off().on('click', function() {
        // console.log(currentDatum.innerHTML);
        if (currentTZ.innerHTML === "GMT") {
          currentTZ.innerHTML = "LST";
          $("#timeToggle").attr('tooltip', "Change to GMT");
        } else {
          currentTZ.innerHTML = "GMT";
          $("#timeToggle").attr('tooltip', "Change to LST");
        }
        updateTime(currentTZ);
      });

      function updatePlotData(unit, datum) {
        var columns = ["Prediction", "Observation", "Residual", "ExtremeLow", "ExtremeHigh"];
        unitYlabel = getLabels(currentUnit, currentDatum).unit;
        datumYlabel = getLabels(currentUnit, currentDatum).datum;

        for (var i = 0; i < columns.length; i++) {
          var update = {
            y: [unpack(rows, columns[i], unit, datum, MLLW, MHHW, LST)]
          };
          var layout_update = {
            yaxis: {
              title: 'Relative water level (' + unitYlabel + ', ' + datumYlabel + ')',
              autorange: true,
              range: [0, 1000],
              type: 'linear',
            }
          };
          // layout_update.yaxis.title = "Relative water level (ft, MLLW)";
          Plotly.update('tideplot1', update, layout_update, [i]);
          if (columns[i] === "Residual") {
            layout_update.yaxis.title = 'Relative water level (' + unitYlabel + ')';
            Plotly.update('tideplot2', update, layout_update, [0]);
          }
        }
      }

      function updateTime(tz) {
        var xLabel = "Time/Date " + '(' + tz.innerHTML + ')';
        var tv = {
          x: [unpack(rows, 'Time', currentUnit, currentDatum, MLLW, MHHW, LST, tz)]
        };
        var update = {
          xaxis: {
            title: xLabel,
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
        }
        Plotly.update('tideplot1', tv, update);
        Plotly.update('tideplot2', tv, update);
      }
    }
    // , function(error) {
    //   myerror = error;
    //   console.log(error);
    //   alert("Data for station number: "+_stn+" is missing");
    // }
  )

};

function getLabels(unit, datum) {
  var combo = "";
  var unt = "cm";
  var dtm = "MLLW";
  if (unit.innerHTML === DEFAULT_VALUES.unit && datum.innerHTML === DEFAULT_VALUES.datum)
  //Metric + MLLW
  {
    combo = "ML";
    unt = "cm";
    dtm = "MLLW";
  } else if (unit.innerHTML != DEFAULT_VALUES.unit && datum.innerHTML === DEFAULT_VALUES.datum)
  //English units + MLLW
  {
    combo = "EL";
    unt = "ft";
    dtm = "MLLW";
  } else if (unit.innerHTML === DEFAULT_VALUES.unit && datum.innerHTML != DEFAULT_VALUES.datum)
  //Metric + MHHW
  {
    combo = "MH";
    unt = "cm";
    dtm = "MHHW";
  } else
  // English + MHHW
  {
    combo = "EH";
    unt = "ft";
    dtm = "MHHW";
  }
  var result = {
    "unit": unt,
    "datum": dtm
  }
  return result;

}
