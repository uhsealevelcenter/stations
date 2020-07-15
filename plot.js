function plotData(_stn) {
  Plotly.d3.csv(URL_pre + "RAPID/" + _stn + ".csv", function(err, rows) {
      // if(err & err.status==404){
      //   console.log("Data for this station not found");
      //   return
      // }
      function unpack(rows, key, unit, datum, ml, mh, lst, tz) {
        if (err) {
          // Plotly.purge("tideplot1");
          // Plotly.purge("tideplot2");
          // $("#tideplot1").text("Real-time water level data for station " + _stn + " is not available. Tide tables and datum information are available on subsequent tabs.");
          // // alert("Water Levels data for station number: " + _stn + " is missing");
          // $("#product_desc").hide();
          // return;
        } else {
          // $("#tideplot1").empty();
        }
        if (typeof rows != 'undefined') {
          return rows.map(function(row) {
            if (row[key] == "")
              row[key] = "NaN";
            if (key === "Time") {
              if (!tz) {
                // The file that is being loaded is not in ISO format. Adding :00Z to hours for GMT converts to ISO so that we can manipualte the date later
                // Don't add :00Z if it is already there
                if (!row[key].includes(":"))
                  row[key] = row[key] + ":00Z";
                if (row[key].includes(" "))
                  row[key] = row[key].replace(" ", "T");
                var date = new Date(row[key]);
                date.setHours(date.getHours() + lst);
                return date.toISOString();
              } else
                return row[key];
            }
            // if seeking datum or time zone value return the value so the "else" portion is not executed
            if (key === "MHHW_NTDE" || key === "MLLW_NTDE" || key === "time_zone") {
              if (key === "time_zone") {
                return row[key];
              } else {
                return row[key]/1.0;
              }
            } else {
              if (unit && datum) {
                //Do nothing
                // console.log("NO conversion on station change");
                return row[key]/1.0;
              } else if (!unit && datum) {
                //convert units to english with default datum
                // console.log("Convert only units on station change");
                return row[key] * 3.28084;
              } else if (unit && !datum) {
                // console.log("Convert only datum on station change");
                return (row[key]/1.0 * 1 + (ml - mh));
              } else {
                // console.log("Convert both units and datum on station change");
                return (row[key] * 1 + (ml - mh)) * 3.28084;
              }
            }

          });
        } else {

        }
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

      // Negated because I want the toggle button to be gray (off) by default
      // and also want the "off" state to indicate default values
      var currentUnit = !$('#unitToggle').prop("checked");
      var currentDatum = $('#datumToggle').prop("checked");
      var currentTZ = !$('#timeToggle').prop("checked");

      var unitYlabel = getYLabel(currentUnit, currentDatum).unit;
      var datumYlabel = getYLabel(currentUnit, currentDatum).datum;
      var yLabel1 = 'Relative water level (' + unitYlabel + ', ' + datumYlabel + ')';
      var yLabel2 = 'Relative water level (' + unitYlabel + ')';
      if (typeof rows != 'undefined') {
        var MLLW = parseFloat(unpack(rows, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
        var MHHW = parseFloat(unpack(rows, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
        var LST = parseFloat(unpack(rows, 'time_zone', currentUnit, currentDatum)[0]);
        var xLabel = getXLabel(currentTZ, LST);

        // There is no need to unpack time vector for every tracer
        // because it is the same for each tracer
        var timeVector = unpack(rows, 'Time', currentUnit, currentDatum, MLLW, MHHW, LST, currentTZ);

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
          // specifying true for datum because residual should not be scaled
          y: unpack(rows, 'Residual', currentUnit, true, MLLW, MHHW, LST),
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
          autosize: true,
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
            hoverformat: ".2f"
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
            r: 30, //105
            b: 40,
            t: 80,
            pad: 0
          },
        };

        var layout3 = {
          showlegend: true,
          // title: 'Residual (observation minus prediction)',
          width: 1050,
          height: 450,
          autosize: true,
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
            type: 'linear',
            hoverformat: ".2f"
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
            r: 30, //105
            b: 40,
            t: 60,
            pad: 0
          },
        };


        // console.log(rows[0]);
        Plotly.newPlot('tideplot1', data123, layout123, {
          displayModeBar: false,
          responsive: true
        });

        Plotly.newPlot('tideplot2', data3, layout3, {
          displayModeBar: false,
          responsive: true
        });
        $("#product_desc").show();
      } else {
        Plotly.purge("tideplot1");
        Plotly.purge("tideplot2");
        $("#tideplot1").text("Real-time water level data for station " + _stn + " is not available. Tide tables and datum information are available on subsequent tabs.");
        // alert("Water Levels data for station number: " + _stn + " is missing");
        $("#product_desc").hide();
      }


      // On button click station behavior
      $(".toggleclass").off().on('change', function() {
        // Negated because I want the toggle button to be gray (off) by default
        // and also want the "off" state to indicate default values
        if (typeof rows != 'undefined')
          updatePlotData(!$('#unitToggle').prop("checked"), !$('#datumToggle').prop("checked"));
        loadtabs(_stn, getCurrentDate());
      });
      $("#timeToggle").off().on('change', function() {
        console.log("SHOULD CALL UPDATE TIME");
        updateTime(!$('#timeToggle').prop("checked"));
      });

      function updatePlotData(unit, datum) {
        var columns = ["Prediction", "Observation", "Residual", "ExtremeLow", "ExtremeHigh"];
        unitYlabel = getYLabel(unit, datum).unit;
        datumYlabel = getYLabel(unit, datum).datum;

        for (var i = 0; i < columns.length; i++) {
          var update = {};
          // specifying true for datum because residual should not be scaled
          if (columns[i] === "Residual") {
            update = {
              y: [unpack(rows, columns[i], unit, true, MLLW, MHHW, LST)]
            };
          } else {
            update = {
              y: [unpack(rows, columns[i], unit, datum, MLLW, MHHW, LST)]
            };
          }

          var layout_update = {
            yaxis: {
              title: 'Relative water level (' + unitYlabel + ', ' + datumYlabel + ')',
              autorange: true,
              range: [0, 1000],
              type: 'linear',
            },
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
        console.log("TIMEZONE "+tz);
        var xLabel = getXLabel(tz, LST);
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
        console.log("TV ", tv);
        console.log("xLabel ", xLabel);
        Plotly.update('tideplot1', tv, update);
        Plotly.update('tideplot2', tv, update);
      }
      // window.onresize = onScreenResizeWaterLevels;
      // onScreenResizeWaterLevels();
      if (window.mobilecheck()) {
        layoutUpdate = {
          width: document.getElementById("metaBox").offsetWidth, // or any new width
          autoresize: true,
          legend: {
            xanchor: "center",
            yanchor: "top",
            "orientation": "h",
            x: 0.5,
            y: 1.4,
          },
        };
      } else {
        layoutUpdate = {
          // width: document.getElementById("metaBox").offsetWidth, // or any new width
          autoresize: true,
        };
      }

      Plotly.relayout('tideplot1', layoutUpdate);
      Plotly.relayout('tideplot2', layoutUpdate);

    }
    // , function(error) {
    //   myerror = error;
    //   console.log(error);
    //   alert("Data for station number: "+_stn+" is missing");
    // }
  )

};
var layoutUpdate;

function getYLabel(unit, datum) {
  var combo = "";
  var unt = "m";
  var dtm = "MLLW";
  if (unit && datum)
  //Metric + MLLW
  {
    combo = "ML";
    unt = "m";
    dtm = "MLLW";
  } else if (!unit && datum)
  //English units + MLLW
  {
    combo = "EL";
    unt = "ft";
    dtm = "MLLW";
  } else if (unit && !datum)
  //Metric + MHHW
  {
    combo = "MH";
    unt = "m";
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

function getXLabel(selection, lst) {
  var xLabel = "";
  // Format the LST variable so that when it is negative there is a space between the minus sign and the number and
  // when it is positive add the "+" sign and a space
  var time_zone_str = lst >= 0 ? '+ ' + lst.toString() : [lst.toString().slice(0, 1), " ", lst.toString().slice(1)].join('');
  if (selection) {
    xLabel = "Time/Date " + '(' + "GMT" + ')';
  } else {
    xLabel = "Time/Date " + '(' + "LST" + ' = GMT ' + time_zone_str + 'hr)';
  }

  return xLabel;
}

window.mobilecheck = function() {
  var check = false;
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};

window.addEventListener("orientationchange", function() {
  update = {
    width: screen.width - 25, // or any new width
    autoresize: true,
    legend: {
      xanchor: "center",
      yanchor: "top",
      "orientation": "h",
      x: 0.5,
      y: 1.4,
    },
  };
  Plotly.relayout('tideplot1', update);
  Plotly.relayout('tideplot2', update);

  update3 = {
    width: screen.width, // or any new width
    autoresize: true,
    legend: {
      xanchor: "center",
      yanchor: "top",
      "orientation": "h",
      x: 0.5,
      y: 1.2,
    },
    margin: {
      l: 70,
      r: 30, //105
      b: 60,
      t: 80,
      pad: 0
    }
  };

  Plotly.relayout('climateDaily', update3);
  Plotly.relayout('climateMonthly', update3);
  Plotly.relayout('extremeMonthly', update3);
}, false);
