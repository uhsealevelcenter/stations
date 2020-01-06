// var patt1 = new RegExp("^(?!([ \\d]*-){2})\\d+(?: *[-,] *\\d+)*$");
// This one should not allow 5 digit or larger numbers
var patt1 = new RegExp("^(?!([ \\d]*-){2})\\d{4,4}(?: *[-,] *\\d{4,4})*$")
// This one below should limit the year between 1905 and 2019
// var patt1 = new RegExp("^(?!([ \\d]*-){2})\\b(190[5-9]|19[1-9][0-9]|200[0-9]|201[0-9])\\b(?: *[-,] *\\b(190[5-9]|19[1-9][0-9]|200[0-9]|201[0-9])\\b)*$")
var ALL_DAYS = DOY_to_dates();
var RECORD_HIGH_COLOR = 'rgb(200, 35, 35)';
var RECORD_LOW_COLOR = RECORD_HIGH_COLOR;
var AVERAGE_HIGH_COLOR = '#1f77b4';
var AVERAGE_LOW_COLOR = AVERAGE_HIGH_COLOR;
function plotClimateData(_stn) {

  var dailyData = null;
  var monthlyHrData = null;
  var monthlyData = null;

  function unpack(rows, key, unit, datum, ml, mh, lst, tz, err) {
    if (err) {

    } else {
      // $("#climateDaily").empty();
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
        if(key === "Year_Record_High" || key === "Year_Record_Low"){
          return row[key];
        }

        // if seeking datum or time zone value return the value so the "else" portion is not executed
        if (key === "MHHW_NTDE" || key === "MLLW_NTDE" || key === "time_zone") {
          return row[key];
        } else {
          if (unit && datum) {
            //Do nothing
            // console.log("Default unit and datum");
            return row[key]-ml;
          } else if (!unit && datum) {
            //convert units to english with default datum
            // console.log("Convert only units on station change");
            return row[key] * 0.0328084;
          } else if (unit && !datum) {
            // console.log("Convert only datum on station change");
            return (row[key] * 1 - (mh));
          } else {
            // console.log("Convert both units and datum on station change");
            return (row[key] * 1 - (mh)) * 0.0328084;
          }
        }

      });
    } else {

    }
  }

  // Negated because I want the toggle button to be gray (off) by default
  // and also want the "off" state to indicate default values
  var currentUnit = !$('#unitToggle').prop("checked");
  var currentDatum = !$('#datumToggle').prop("checked");
  var currentTZ = !$('#timeToggle').prop("checked");

  var unitYlabel = getYLabel(currentUnit, currentDatum).unit;
  var datumYlabel = getYLabel(currentUnit, currentDatum).datum;
  var yLabel1 = 'Water level above '+datumYlabel+' ('+unitYlabel+')';
  // var yLabel1 = 'Relative water level (' + unitYlabel + ', ' + datumYlabel + ')';
  var yLabel2 = 'Water level above '+datumYlabel+' ('+unitYlabel+')';
  // DAILY CLIMATOLOGY
  Plotly.d3.csv("CLIM/daily_clim"+_stn+".csv", function(err, rows) {

    if (typeof rows != 'undefined') {
      var MLLW = parseFloat(unpack(rows, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
      var MHHW = parseFloat(unpack(rows, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
      var LST = parseFloat(unpack(rows, 'time_zone', currentUnit, currentDatum)[0]);

      // console.log("currentUnit= "+currentUnit);
      // console.log("currentDatum= "+currentDatum);
      // console.log("MLLW= "+MLLW);
      // There is no need to unpack time vector for every tracer
      // because it is the same for each tracer
      console.log(rows.length);

      var timeRange =  range(1, rows.length);

      // Year record high
      var trace_yearRH = {
        x: ALL_DAYS,
        y: unpack(rows, 'Year_Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
      };
      // Year record low
      var trace_yearRL = {
        x: ALL_DAYS,
        y: unpack(rows, 'Year_Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
      };
      // console.log("RECORD HIGH YEARS "+trace_yearRH.y);

      var trace_al = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'lines',
        name: 'Average Low',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: unpack(rows, 'Avg_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: AVERAGE_LOW_COLOR,
          dash: 'dash'
        },
        stackgroup: null
      };

      var trace_ar = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'none',
        name: 'Average Range',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: trace_al.y,
        hoverinfo: 'skip',
        // stackgroup: null
        fill: 'tonexty'
      };

      var trace1 = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'lines',
        name: 'Average High',
        type: 'scatter',
        // fill: 'tonexty',
        // x: timeRange,
        x: ALL_DAYS,
        y: unpack(rows, 'Avg_High', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: AVERAGE_HIGH_COLOR,
          dash: 'dash'
        },
        stackgroup: null
      };

      var trace_rl = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Record Low',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: unpack(rows, 'Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_LOW_COLOR
        },
        hovertemplate:'%{y:.1f}: %{text}',
        text: trace_yearRL.y,
        visible: true,
        stackgroup: null
      };

      var trace_rr = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'none',
        name: 'Record Range',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: trace_rl.y,
        hoverinfo: 'skip',
        // stackgroup: null
        fill: 'tonexty'
      };

      var trace2 = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Record High',
        type: 'scatter',
        // fill: 'tonexty',
        // x: timeRange,


        x: ALL_DAYS,
        y: unpack(rows, 'Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_HIGH_COLOR
        },
        hovertemplate:'%{y:.1f}: %{text}',
        text: trace_yearRH.y,
        visible: true,
        stackgroup: null
      };

      var trace_ad = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Average Daily',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: unpack(rows, 'Avg_Daily', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: 'rgb(255, 255, 255)'
        },
        visible: true,
        stackgroup: null
      };

      var trace3 = {
        // meta: {columnNames: {y: '2017'}},
        mode: 'lines',
        name: '2019 High',
        type: 'scatter',
        // x: timeRange,
        x: ALL_DAYS,
        y: unpack(rows, '2019', currentUnit, currentDatum, MLLW, MHHW, LST),
        visible: true,
        stackgroup: null,
        line: {
          color: 'rgb(0, 0, 0)',
          width: 4
        }
      };

      // var trace4 = {
      //   // meta: {columnNames: {y: '2019'}},
      //   mode: 'lines',
      //   name: '2019 high',
      //   type: 'scatter',
      //   y: unpack(rows, '2019', currentUnit, currentDatum, MLLW, MHHW, LST),
      //   stackgroup: null
      // };


      var data123 = [trace2, trace_rr, trace_rl, trace1, trace_ar, trace_al,   trace_ad, trace3];
      var data3 = [trace3];

      var layout123 = {
        // title: 'Stn:' + _stn,
        width: 1000,
        height: 450,
        autoresize: true,
        // updatemenus: updatemenus,
        xaxis: {
          tickformat: '%b %_d',
          hoverformat: "%B %d",
          // tickmode: 'linear',
          // tick0: '1999-12-15',
		      dtick: "M1", // milliseconds
          title: {
            text: ''
          },

          autorange: true,
          // range: [0, 365],
          type: "date"
        },
        yaxis: {
          title: yLabel1,
          hoverformat: ".1f",
          // title: {
          //   text: 'Water level above station zero (cm)'
          // },
          autorange: true,
          range: [0, 1000],
          type: 'linear',
        },
        legend: {
          xanchor: "center",
          yanchor: "top",
          "orientation": "h",
          x: 0.5,
          y: 1.15,
          bgcolor: '#f2f2f2'
        },
        margin: {
          l: 70,
          r: 30, //105
          b: 40,
          t: 80,
          pad: 0
        },
      };
      var myPlot = document.getElementById('climateDaily');


      Plotly.newPlot('climateDaily', data123, layout123, {
        displayModeBar: false
      });

      myPlot.on('plotly_legendclick',function(data) {
        console.log("legend "+data.curveNumber);
        //TODO: dynamically decide the default year and curve number
        if(data.curveNumber == 7){
          alert("Cannot disable default year.")
          return false;
        }

        else
          return true;
      })

      // Plotly.newPlot('climateMonthly', data3, layout3, {
      //   displayModeBar: false
      // });
      $("#product_desc").show();
    } else {
      Plotly.purge("climateDaily");
      // Plotly.purge("climateMonthly");
      $("#climateDaily").text("");
      // alert("Water Levels data for station number: " + _stn + " is missing");
      $("#product_desc").hide();
    }


    // On button click station behavior
    // $(".toggleclass").off().on('change', function() {
    //   // Negated because I want the toggle button to be gray (off) by default
    //   // and also want the "off" state to indicate default values
    //   if (typeof rows != 'undefined')
    //     updatePlotData(!$('#unitToggle').prop("checked"), !$('#datumToggle').prop("checked"));
    // });
    // $("#timeToggle").off().on('change', function() {
    //   // updateTime(!$('#timeToggle').prop("checked"));
    // });

    // function updatePlotData(unit, datum) {
    //   // var columns = ["Prediction", "Observation", "Residual", "ExtremeLow", "ExtremeHigh"];
    //   unitYlabel = getYLabel(unit, datum).unit;
    //   datumYlabel = getYLabel(unit, datum).datum;
    //   console.log("UPDAT PLOT CALLED "+ unit + datum);
    //   for (var i = 0; i < data123.length; i++) {
    //
    //     // console.log("data123 "+data123[i].y.map(function(item) {
    //     //   return item - MLLW;
    //     // }));
    //     var update = {};
    //       // update = {
    //       //   y: [data123[i].y.map(function(item) {
    //       //     return item - MLLW;
    //       //   })]
    //       // };
    //
    //
    //     var layout_update = {
    //       yaxis: {
    //         title: 'Water level above '+datumYlabel+' ('+unitYlabel+')',
    //         // autorange: true,
    //         // range: [0, 1000],
    //         // type: 'linear',
    //       },
    //     };
    //     // layout_update.yaxis.title = "Relative water level (ft, MLLW)";
    //     Plotly.update('climateDaily', update, layout_update, [i]);
    //       layout_update.yaxis.title = 'Water level above '+datumYlabel+' ('+unitYlabel+')';
    //   }
    // }
    dailyData = rows;
  });
  // DAILY CLIMATOLOGY End
  // MONTHLY hourly
  Plotly.d3.csv("CLIM/monthlyHr_clim"+_stn+".csv", function(err, rows) {

    if (typeof rows != 'undefined') {
      var MLLW = parseFloat(unpack(rows, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
      var MHHW = parseFloat(unpack(rows, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
      var LST = parseFloat(unpack(rows, 'time_zone', currentUnit, currentDatum)[0]);

      // console.log("currentUnit= "+currentUnit);
      // console.log("currentDatum= "+currentDatum);
      // console.log("MLLW= "+MLLW);
      // There is no need to unpack time vector for every tracer
      // because it is the same for each tracer
      console.log(rows.length);

      var timeRange =  range(1, rows.length);

      // Year record high
      var trace_yearRH = {
        x: timeRange,
        y: unpack(rows, 'Year_Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
      };
      // Year record low
      var trace_yearRL = {
        x: timeRange,
        y: unpack(rows, 'Year_Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
      };
      // console.log("RECORD HIGH YEARS "+trace_yearRH.y);

      var trace_al = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'lines',
        name: 'Average Low',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: unpack(rows, 'Avg_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: AVERAGE_LOW_COLOR,
          dash: 'dash'
        },
        stackgroup: null
      };

      var trace_ar = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'none',
        name: 'Average Range',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: trace_al.y,
        hoverinfo: 'skip',
        // stackgroup: null
        fill: 'tonexty'
      };

      var trace1 = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'lines',
        name: 'Average High',
        type: 'scatter',
        // fill: 'tonexty',
        // x: timeRange,
        x: timeRange,
        y: unpack(rows, 'Avg_High', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: AVERAGE_HIGH_COLOR,
          dash: 'dash'
        },
        stackgroup: null
      };

      var trace_rl = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Record Low',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: unpack(rows, 'Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_LOW_COLOR
        },
        hovertemplate:'%{y:.1f}: %{text}',
        text: trace_yearRL.y,
        visible: true,
        stackgroup: null
      };

      var trace_rr = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'none',
        name: 'Record Range',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: trace_rl.y,
        hoverinfo: 'skip',
        // stackgroup: null
        fill: 'tonexty'
      };

      var trace2 = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Record High',
        type: 'scatter',
        // fill: 'tonexty',
        // x: timeRange,


        x: timeRange,
        y: unpack(rows, 'Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_HIGH_COLOR
        },
        hovertemplate:'%{y:.1f}: %{text}',
        text: trace_yearRH.y,
        visible: true,
        stackgroup: null
      };

      var trace_ad = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Average Daily',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: unpack(rows, 'Avg_Daily', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: 'rgb(255, 255, 255)'
        },
        visible: true,
        stackgroup: null
      };

      var trace3 = {
        // meta: {columnNames: {y: '2017'}},
        mode: 'lines',
        name: '2019 High',
        type: 'scatter',
        // x: timeRange,
        x: timeRange,
        y: unpack(rows, '2019', currentUnit, currentDatum, MLLW, MHHW, LST),
        visible: true,
        stackgroup: null,
        line: {
          color: 'rgb(0, 0, 0)',
          width: 4
        }
      };

      // var trace4 = {
      //   // meta: {columnNames: {y: '2019'}},
      //   mode: 'lines',
      //   name: '2019 high',
      //   type: 'scatter',
      //   y: unpack(rows, '2019', currentUnit, currentDatum, MLLW, MHHW, LST),
      //   stackgroup: null
      // };


      var data123 = [trace2, trace_rr, trace_rl, trace1, trace_ar, trace_al,   trace_ad, trace3];
      var data3 = [trace3];

      var layout123 = {
        // title: 'Stn:' + _stn,
        width: 1000,
        height: 450,
        autoresize: true,
        // updatemenus: updatemenus,
        xaxis: {
          tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
          tickvals: timeRange,
          ticktext: ['January', 'February', 'March', 'April', 'May', 'June', 'July','August', 'September','October', 'November', 'December'],
          title: {
            text: ''
          },
          autorange: true
          // range: [0, 11]
        },
        yaxis: {
          title: yLabel1,
          hoverformat: ".1f",
          // title: {
          //   text: 'Water level above station zero (cm)'
          // },
          autorange: true,
          range: [0, 1000],
          type: 'linear',
        },
        legend: {
          xanchor: "center",
          yanchor: "top",
          "orientation": "h",
          x: 0.5,
          y: 1.15,
          bgcolor: '#f2f2f2'
        },
        margin: {
          l: 70,
          r: 30, //105
          b: 40,
          t: 80,
          pad: 0
        },
      };
      var myPlot = document.getElementById('extremeMonthly');


      Plotly.newPlot('extremeMonthly', data123, layout123, {
        displayModeBar: false
      });

      myPlot.on('plotly_legendclick',function(data) {
        console.log("legend "+data.curveNumber);
        //TODO: dynamically decide the default year and curve number
        if(data.curveNumber == 7){
          alert("Cannot disable default year.")
          return false;
        }

        else
          return true;
      })

      // Plotly.newPlot('climateMonthly', data3, layout3, {
      //   displayModeBar: false
      // });
      $("#product_desc").show();
    } else {
      Plotly.purge("extremeMonthly");
      // Plotly.purge("climateMonthly");
      $("#extremeMonthly").text("");
      // alert("Water Levels data for station number: " + _stn + " is missing");
      $("#product_desc").hide();
    }


    // On button click station behavior
    // $(".toggleclass").off().on('change', function() {
    //   // Negated because I want the toggle button to be gray (off) by default
    //   // and also want the "off" state to indicate default values
    //   if (typeof rows != 'undefined')
    //     updatePlotData(!$('#unitToggle').prop("checked"), !$('#datumToggle').prop("checked"));
    // });
    // $("#timeToggle").off().on('change', function() {
    //   // updateTime(!$('#timeToggle').prop("checked"));
    // });

    // function updatePlotData(unit, datum) {
    //   // var columns = ["Prediction", "Observation", "Residual", "ExtremeLow", "ExtremeHigh"];
    //   unitYlabel = getYLabel(unit, datum).unit;
    //   datumYlabel = getYLabel(unit, datum).datum;
    //   console.log("UPDAT PLOT CALLED "+ unit + datum);
    //   for (var i = 0; i < data123.length; i++) {
    //
    //     // console.log("data123 "+data123[i].y.map(function(item) {
    //     //   return item - MLLW;
    //     // }));
    //     var update = {};
    //       // update = {
    //       //   y: [data123[i].y.map(function(item) {
    //       //     return item - MLLW;
    //       //   })]
    //       // };
    //
    //
    //     var layout_update = {
    //       yaxis: {
    //         title: 'Water level above '+datumYlabel+' ('+unitYlabel+')',
    //         // autorange: true,
    //         // range: [0, 1000],
    //         // type: 'linear',
    //       },
    //     };
    //     // layout_update.yaxis.title = "Relative water level (ft, MLLW)";
    //     Plotly.update('extremeMonthly', update, layout_update, [i]);
    //       layout_update.yaxis.title = 'Water level above '+datumYlabel+' ('+unitYlabel+')';
    //   }
    // }
    monthlyHrData = rows;
  });
  // Monthly Hourly End

  // MONTHLY
  Plotly.d3.csv("CLIM/monthly_clim"+_stn+".csv", function(err, rows) {


    if (typeof rows != 'undefined') {
      var MLLW = parseFloat(unpack(rows, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
      var MHHW = parseFloat(unpack(rows, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
      var LST = parseFloat(unpack(rows, 'time_zone', currentUnit, currentDatum)[0]);

      // There is no need to unpack time vector for every tracer
      // because it is the same for each tracer
      console.log(rows.length);
      var timeRange =  range(1, rows.length);

      // Year record high
      var trace_yearRH = {
        x: timeRange,
        y: unpack(rows, 'Year_Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
      };
      // Year record low
      var trace_yearRL = {
        x: timeRange,
        y: unpack(rows, 'Year_Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
      };

      var trace2 = {
        // meta: {columnNames: {y: 'Record_High'}},
        mode: 'lines',
        name: 'Record Low',
        type: 'scatter',
        x: timeRange,
        y: unpack(rows, 'Record_Low', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_LOW_COLOR
        },
        hovertemplate:'%{y:.1f}: <extra>%{text} Record Low</extra>',
        text: trace_yearRL.y,
        visible: true,
        stackgroup: null
      };

      var trace_rr_m = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'none',
        name: 'Record Range',
        type: 'scatter',
        // x: timeRange,
        x: trace2.x,
        y: trace2.y,
        hoverinfo: 'skip',
        // stackgroup: null
        fill: 'tonexty'
      };

      var trace1 = {
        // meta: {columnNames: {y: 'Avg_High'}},
        mode: 'lines',
        name: 'Record High',
        type: 'scatter',
        x: timeRange,
        y: unpack(rows, 'Record_High', currentUnit, currentDatum, MLLW, MHHW, LST),
        line: {
          color: RECORD_HIGH_COLOR
        },
        hovertemplate:'%{y:.1f}: <extra>%{text} Record High</extra>',
        text: trace_yearRH.y,
        stackgroup: null
      };



      var trace3 = {
        // meta: {columnNames: {y: '2017'}},
        mode: 'lines',
        name: 'Average Monthly',
        type: 'scatter',
        x: timeRange,
        y: unpack(rows, 'Avg_Monthly', currentUnit, currentDatum, MLLW, MHHW, LST),
        line:{
          color: 'rgb(255, 255, 255)'
        },
        visible: true,
        stackgroup: null
      };

      var trace4 = {
        // meta: {columnNames: {y: '2019'}},
        mode: 'lines',
        name: '2019 Monthly Mean',
        type: 'scatter',
        x: timeRange,
        y: unpack(rows, '2019', currentUnit, currentDatum, MLLW, MHHW, LST),
        stackgroup: null
      };


      var data123 = [ trace1,trace_rr_m, trace2,  trace3, trace4];
      var data3 = [trace3];

      var layout123 = {
        // title: 'Stn:' + _stn,
        width: 1000,
        height: 450,
        autoresize: true,
        xaxis: {
          tickmode: "array", // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
          tickvals: timeRange,
          ticktext: ['January', 'February', 'March', 'April', 'May', 'June', 'July','August', 'September','October', 'November', 'December'],
          title: {
            text: ''
          },
          autorange: true
          // range: [0, 11]
        },
        yaxis: {
          title: yLabel1,
          hoverformat: ".1f",
          // title: {
          //   text: 'Water level above station zero (cm)'
          // },
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
          bgcolor: '#f2f2f2'
        },
        margin: {
          l: 70,
          r: 30, //105
          b: 40,
          t: 80,
          pad: 0
        },
      };

      var myPlot = document.getElementById('climateMonthly');
      Plotly.newPlot('climateMonthly', data123, layout123, {
        displayModeBar: false
      });

      myPlot.on('plotly_legendclick',function(data) {
        console.log("legend "+data.curveNumber);
        if(data.curveNumber == 4){
          //TODO: dynamically decide the default year and curve number
          alert("Cannot disable default year.")
          return false;
        }

        else
          return true;
      })

      // Plotly.newPlot('climateMonthly', data3, layout3, {
      //   displayModeBar: false
      // });
      $("#product_desc").show();

      monthlyData = rows;
    } else {
      Plotly.purge("climateMonthly");
      // Plotly.purge("climateMonthly");
      $("#climateMonthly").text("");
      // alert("Water Levels data for station number: " + _stn + " is missing");
      $("#product_desc").hide();
    }


    // // On button click station behavior
    // $(".toggleclass").off().on('change', function() {
    //   // Negated because I want the toggle button to be gray (off) by default
    //   // and also want the "off" state to indicate default values
    //   // if (typeof rows != 'undefined')
    //   //   updatePlotData(!$('#unitToggle').prop("checked"), !$('#datumToggle').prop("checked"));
    // });
    // $("#timeToggle").off().on('change', function() {
    //   // updateTime(!$('#timeToggle').prop("checked"));
    // });
  });

  var prevUnique;

  function addYears() {
    console.log("addYears called");
    var x, text, allYears;
    var commaSeparatedYears = [];
    var ranges = [];

    // var patt1 = new RegExp("^(\\s*\\d+\\s*\\-\\s*\\d+\\s*,?|\\s*\\d+\\s*,?)+$");

    // Get the value of the input field with id="yearsBox"
    x = document.getElementById("yearsBox").value;
    xSeparated = x.split(',');
    // When range specified, first number has to be smaller than second
    // It has to be in range of years available
    // The number of years has to be smaller than the maximum allowed amount of traces
    // Comma separated plus range has to be smaller than the max allowed
    if (patt1.test(x)) {
      // console.log("input was ",x);
      // console.log("Comma separated input", x.split(','));

      for (var i = 0; i < xSeparated.length; i++) {
        // Separate by comas and then find the hyphens and craete a range
        if (!xSeparated[i].includes("-")) {
          commaSeparatedYears.push(parseInt(xSeparated[i].trim()));
        } else {
          ranges.push(range(parseInt(xSeparated[i].split('-')[0]), parseInt(xSeparated[i].split('-')[1])));
        }
      }
      ranges = [].concat.apply([], ranges);
      allYears = ranges.concat.apply(ranges, commaSeparatedYears);
      var uniqueYears = [...new Set(allYears)]


      // Look for and remove the default year duplicate
      // TODO: define the default year
      var index = uniqueYears.indexOf(2019);
      if (index > -1) {
        uniqueYears.splice(index, 1);
      }

      // Check if years are in the allowed range
      // TODO: define year limits dinamically
      var index=uniqueYears.findIndex(function(number) {
        return number > 2019 || number<1905;
      });

      if(index>-1)
      {
        // TODO: define year limits dinamically
        text = "The year number must be between 1905 and 2019";
      }
      else
      {
      if (uniqueYears.length > 10)
        text = "The total number of years can't exceed 10. " + uniqueYears.length + " years entered";
      else {
        text = "TIP: Double click on a legend to isolate only one trace";
        if (prevUnique) {
          Plotly.deleteTraces("climateDaily", range(-prevUnique.length, -1));
          Plotly.deleteTraces("extremeMonthly", range(-prevUnique.length, -1));
          Plotly.deleteTraces("climateMonthly", range(-prevUnique.length, -1));
        }

        prevUnique = uniqueYears;
        uniqueYears.forEach(myCallback);
      }
    }

    } else {
      text = "Invalid year range, use e.g. 1995-2000, 2010, 2013-2015";
    }

    document.getElementById("inputMessage").innerText = text;
  }

  plotClimateData.addYears = addYears;
  plotClimateData.reset = reset;

  function myCallback(item, index) {
    console.log(item, index);
    if (item != "") {
      Plotly.addTraces("climateDaily", createNewTrace(item.toString().trim(), dailyData, ' high'));
      Plotly.addTraces("extremeMonthly", createNewTrace(item.toString().trim(), monthlyHrData, ' Monthly Mean'));
      Plotly.addTraces("climateMonthly", createNewTrace(item.toString().trim(), monthlyData, ' Monthly Mean'));
    }
  }

  // function separateCallback(item, index) {
  //   var years = [];
  //   if(!item.includes("-"))
  //   {
  //     yers.push(item);
  //   }
  //   return years;
  // }

  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({
      length
    }, (_, i) => start + i);
  }

  function reset(){
    Plotly.deleteTraces("climateDaily", range(-prevUnique.length, -1));
    Plotly.deleteTraces("extremeMonthly", range(-prevUnique.length, -1));
    Plotly.deleteTraces("climateMonthly", range(-prevUnique.length, -1));
    prevUnique = [];
    document.getElementById("yearsBox").value = "";
    document.getElementById("inputMessage").innerText="";
  }

  function createNewTrace(year, data, legendText) {
    var currentUnit = !$('#unitToggle').prop("checked");
    var currentDatum = !$('#datumToggle').prop("checked");
    var currentTZ = !$('#timeToggle').prop("checked");
    var MLLW = parseFloat(unpack(data, 'MLLW_NTDE', currentUnit, currentDatum)[0]);
    var MHHW = parseFloat(unpack(data, 'MHHW_NTDE', currentUnit, currentDatum)[0]);
    var LST = parseFloat(unpack(data, 'time_zone', currentUnit, currentDatum)[0]);
    var trace = {
      // meta: {columnNames: {y: '2019'}},
      mode: 'lines',
      name: year + legendText,
      type: 'scatter',
      x: [],
      y: unpack(data, year, currentUnit, currentDatum, MLLW, MHHW, LST),
      stackgroup: null,
      line: {
        // color: 'rgb(55, 128, 191)',
        width: 4
      }
    };
    // TODO: this is just for testing
    // make createNewTrace accept 'daily' or 'monthly' string, istead of doing
    // the check based on legend text
    if(legendText == ' high')
      trace.x = ALL_DAYS;
    else
      trace.x = range(1,12);

    return trace;
  }

};

$('#yearsBox').keyup(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  console.log((keycode));
  if (keycode == '13') {
    plotClimateData.addYears();
  } else {
    if (keycode == '8' & document.getElementById("yearsBox").value == "") {
      document.getElementById("inputMessage").innerText = "";
    }
    //   else
    //   {
    //     if(!patt1.test(String.fromCharCode(keycode))){
    //     document.getElementById("inputMessage").innerText = "Invalid year range, use e.g. 1995-2000, 2010, 2013-2015";
    //   }
    // }
  }

  // document.getElementById("inputMessage").innerText = text;
});

$(".funkyradio :input").change(function(e) {
    // console.log($(this).attr('id')); // points to the clicked input button
    switch ($(this).attr('id')) {
      case 'radio1':
        document.getElementById("climateDaily").style.display = "inline";
        document.getElementById("extremeMonthly").style.display = "none";
        document.getElementById("climateMonthly").style.display = "none";
        break;
      case 'radio2':
        document.getElementById("climateDaily").style.display = "none";
        document.getElementById("extremeMonthly").style.display = "inline";
        document.getElementById("climateMonthly").style.display = "none";
        break;
      case 'radio3':
        document.getElementById("climateDaily").style.display = "none";
        document.getElementById("extremeMonthly").style.display = "none";
        document.getElementById("climateMonthly").style.display = "inline";
        break;
      case 'radio4':
        document.getElementById("climateDaily").style.display = "inline";
        document.getElementById("extremeMonthly").style.display = "inline";
        document.getElementById("climateMonthly").style.display = "inline";
        break;
      default:
        document.getElementById("climateDaily").style.display = "inline";
        document.getElementById("extremeMonthly").style.display = "none";
        document.getElementById("climateMonthly").style.display = "none";

    }
});
function DOY_to_dates(){
	var allDays=[];
	for(var i=1; i<=366; i++){
	var date = new Date(2016, 0); // initialize a date in `year-01-01`
	allDays.push(new Date(date.setDate(i)));
}
  return allDays;
}
