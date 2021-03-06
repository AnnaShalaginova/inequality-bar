/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var selectedCountries = ['percentBar-0-90-99-99.9-100', 'USA', 'France'];
var debug = true;

var percentileColors = {
  '0-90': 'lightgreen',
  '90-99': '#5599dd',
  '99-99.9': 'darkorange',
  '99.9-100': '#cc4444',
};
var percentiles = [0, 0.9, 0.99, 0.999, 1.0];

var dataBase = {};
// Data defined in data.js
if (debug) {
  console.log(data);
}
for (var year of Object.keys(data)) {
  dataBase[year] = makePercentiles(data[year]);
}

if (debug) {
  console.log(dataBase);
}

var upNext = '2014';
var displayData = dataBase['1980'];

var chartWidth = 1000;
var chartHeight = 600;
var barHeight = 30;
var barBuffer = 40;

var x = d3.scaleLinear().range([chartWidth * 0.02, chartWidth * 0.98]).domain([
  0, 1.0
]);

var percentileAxis =
    d3.axisBottom().scale(x).tickValues(percentiles).tickFormat(d => {
      if (d < 1.0) {
        return (d * 100).toFixed(1);
      } else {
        return '100';
      }
    });

var chart =
    d3.select('.chart').attr('width', chartWidth).attr('height', chartHeight);

var yShift = chartHeight * 0.10

chart.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(0, ' + (barHeight + yShift).toString() + ')');

function display(year, dataOneYear) {
  chart.selectAll('text.year')
      .data([year])
      .join('text')
      .attr('x', chartWidth / 2)
      .attr('y', yShift / 2)
      .attr('class', 'year')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(d => d);

  var bars =
      chart.selectAll('g.bar')
          .data(selectedCountries)
          .join('g')
          .attr('class', 'bar')
          .attr('id', country => country)
          .attr(
              'transform',
              (d, i) => {return 'translate(0, ' +
                         (yShift + i * (barHeight + barBuffer)).toString() +
                         ')'});


  var rects = bars.selectAll('rect')
      .data(function(country, i) {
        if (country.startsWith('percentBar')) {
          return getPercentilesForPercentBar(country);
        } else {
          var noData = (!dataOneYear.hasOwnProperty(country) ||
                            dataOneYear[country] === null);
          return noData ? [null] : dataOneYear[country];
        }
      })
      .join('rect');

  var hasData = function (percentileDataOrNull) {
    return percentileDataOrNull !== null;
  };

  rects.filter(pd => !hasData(pd))
      .attr('x', x(0.0))
      .attr('y', 0)
      .style('fill', 'white')
      .style('stroke', 'black')
      .attr('height', barHeight)
      .attr('width', x(1.0) - x(0.0));

  rects.filter(pd => hasData(pd))
      .attr('x', percentileData => x(percentileData['sizeLower']))
      .attr('y', 0)
      .style('fill', pd => percentileColors[pd['lower'] + '-' + pd['upper']])
      .attr('height', barHeight)
      .attr('width', pd => x(pd['sizeUpper']) - x(pd['sizeLower']));

  bars.selectAll('text.barSize')
      .data(
          country => {
            if (country.startsWith('percentBar')) {
              return [];
            } else {
              var noData = (!dataOneYear.hasOwnProperty(country) ||
                            dataOneYear[country] === null);
              return noData ? [] : dataOneYear[country];
            }
          })
      .join('text')
      .attr('class', 'barSize')
      .attr('x', pd => (x(pd['sizeLower']) + x(pd['sizeUpper'])) / 2)
      .attr('y', barHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(pd => (pd['size'] * 100).toFixed(1));

  bars.selectAll('text.countryName')
      .data(country => [country])
      .join('text')
      .attr('class', 'countryName')
      .attr('x', x(0))
      .attr('y', -5)
      .text(c => c);

  chart.selectAll('g.axis')
      .call(percentileAxis)
      .selectAll('g.tick')
      .each(function(d, i) {
        if (d > 0.901) {
          var extraHeight = 5;
          var xShift = (i + 1 - percentiles.length) * 25;
          //(i - 2) *
          //        25).toString();  // this kludge will fail hopelessly
          // if I ever change the percentiles
          var line = d3.select(this).select('line');
          var y2 = line.attr('y2');
          line.attr('y2', (parseInt(y2) + extraHeight)).attr('x2', xShift);
          d3.select(this).select('text').attr(
              'transform',
              'translate(' + xShift + ', ' + extraHeight.toString() + ')');
        }
      });
}

function toggle() {
  dataOneYear = dataBase[upNext];
  display(upNext, dataOneYear);
  if (upNext === '2014') {
    upNext = '1980';
  } else {
    upNext = '2014';
  }
}

function setYear() {
  var year = document.getElementById('foo').value;
  if (dataBase[year] != null) {
    display(year, dataBase[year]);
  }
}

display('1980', displayData);
