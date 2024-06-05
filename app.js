const EDUCATION_URL =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const COUNTY_URL =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";
const fullwidth = 1000;
const fullheight = 700;
const padding = 25;
const width = fullwidth - 2 * padding;
const height = fullheight - 2 * padding;

Promise.all([
  d3.json(COUNTY_URL), //Load Map Data
  d3.json(EDUCATION_URL), //Load Shading Data
]).then(([countyData, educationData]) => {
  //County and State outlines

  var usCounties = topojson.feature(countyData, countyData.objects.counties); //convert TopoJSON to GeoJSON.
  var usStates = topojson.mesh(
    countyData,
    countyData.objects.states,
    function (a, b) {
      return a !== b;
    }
  ); //convert TopoJSON to GeoJSON Mesh Overlay
  var path = d3.geoPath();

  //Create toolTips DIV
  var toolTips = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip")
    .style("background", "Beige")
    .style("color", "Black")
    .style("opacity", 0); //Hide until mouseover

  //Setup Color Scale
  var minEducation = d3.min(educationData, (d) => d.bachelorsOrHigher);
  var maxEducation = d3.max(educationData, (d) => d.bachelorsOrHigher);
  var stepVariance = (Math.abs(maxEducation) - Math.abs(minEducation)) / 10;
  //	console.log("minEducation:" + minEducation + " maxEducation:" +maxEducation);

  //Create SVG
  var svg = d3
    .select("#graph")
    .append("svg")
    .attr("width", fullwidth)
    .attr("height", fullheight);

  var target;
  // Draw Counties Map
  svg
    .selectAll("path")
    .data(usCounties.features)
    .enter()
    .append("path")
    .style("fill", function (d) {
      target = educationData.filter(function (object) {
        return object.fips == d.id;
      });
      if (target.length > 0) {
        //We use a built in D3 color scale to provide shading
        return d3.interpolateRdYlBu(
          1 - target[0].bachelorsOrHigher / Math.round(maxEducation)
        );
      } else {
        return "beige";
      }
    })
    .style("stroke", "grey")
    .style("stroke-width", "0.5px")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", function (d) {
      target = educationData.filter(function (object) {
        return object.fips == d.id;
      });
      if (target.length > 0) {
        return target[0].bachelorsOrHigher;
      }
    })
    .attr("d", path)
    .on("mouseover", function (d, i) {
      d3.select(this).style("stroke", "black").style("stroke-width", 0.9);

      target = educationFilter(educationData, d.id);
      toolTips
        .html(
          target[0].area_name +
            ", " +
            target[0].state +
            "<br/>" +
            target[0].bachelorsOrHigher +
            "%"
        )
        .attr("data-education", target[0].bachelorsOrHigher)
        .style("left", d3.event.pageX + 15 + "px")
        .style("top", d3.event.pageY - 50 + "px")
        .style(
          "background",
          d3.interpolateRdYlBu(
            1 - target[0].bachelorsOrHigher / Math.round(maxEducation)
          )
        )
        .style("opacity", 0.9); //Reveal on mouseover
    })
    .on("mouseout", function (d, i) {
      d3.select(this).style("stroke", "grey").style("stroke-width", 0.5);

      toolTips.style("opacity", 0); //Hide until mouseover
    });

  // Draw States Map Overlay
  svg
    .append("path")
    .datum(usStates)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-linejoin", "round")
    .attr("class", "states")
    .attr("d", path);

  //Setup legend gradient
  var defs = svg.append("defs");
  var numStops = 2;
  var numBlocks = 10;
  var gradient = [];
  for (var n = 0; n < numBlocks; ++n) {
    gradient[n] = defs
      .append("linearGradient")
      .attr("id", "svgGradient" + n)
      .attr("x1", "0%")
      .attr("x2", "100%")
      .selectAll("stop")
      .data(d3.range(numStops))
      .enter()
      .append("stop")
      .attr("offset", (d) => d / numStops)
      .attr("stop-color", function (d, i) {
        return d3.interpolateRdYlBu(1 - (d + n) * 0.1);
        console.log(1 - (d + n) * 0.1);
      });
  }

  //Add SVG Legend
  var legend = svg.append("g").attr("class", "legend").attr("id", "legend");

  //Add colored rectangles to legend
  var legendSize = 20;
  var legendLength = 10;
  var stopOffset = "";
  for (var k = 0; k < numBlocks; ++k) {
    legend
      .append("rect")
      .style("stroke", "black")
      .style("stroke-width", 1.5)
      .attr("x", 0.1 * fullwidth + k * (legendSize * 2 + 1))
      .attr("y", fullheight - padding)
      .attr("width", legendSize * 3 + 1)
      .attr("height", legendSize / 2)
      .style("fill", "url(#svgGradient" + k + ")");
  }

  //Add text to legend
  for (var j = 0; j <= legendLength; ++j) {
    legend
      .append("text")
      .attr("x", 0.1 * fullwidth + j * (legendSize * 2 + 1))
      .attr("y", fullheight - padding - legendSize * 0.5)
      .text(Math.round((minEducation + j * stepVariance) * 100) / 100);
  }
});

//Function for retrieving education info by ID
function educationFilter(educationData, targetID) {
  var target = educationData.filter(function (object) {
    return object.fips == targetID;
  });
  return target.slice();
}
