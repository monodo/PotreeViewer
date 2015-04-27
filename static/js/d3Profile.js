/***
* Parse the profile's points and project them along the profile's segments
***/
pv.profile.getProfilePoints = function(){

    var profile = pv.scene3D.profileTool.profiles[pv.scene3D.profileTool.profiles.length - 1];
    var segments = pv.scene3D.pointcloud.getPointsInProfile(profile, 2);
    console.log(segments);
    var data = [];
    var distance = 0;
    var totalDistance = 0;
    var minX = Math.max();
    var minY = Math.max();
    var minZ = Math.max();
    var maxX = 0;
    var maxY = 0;
    var maxZ = 0;
    
    for(var i = 0; i < segments.length; i++){
        var segment = segments[i];        
        var xOA = segment.end.x - segment.start.x;
        var yOA = segment.end.z - segment.start.z;
        var segmentLength = Math.sqrt(xOA * xOA + yOA * yOA);
        var points = segment.points;
        // TODO: add attribute support
        for(var j = 0; j < points.numPoints; j++){
            
            var p = points.position[j];

            // get min/max values            
            if (p.x < minX) {
                minX = p.x;
            };
            
            if (p.y < minY) {
                minY = p.y;
            };
            
            if (p.z < minZ) {
                minZ = p.z
            };
            
            if (p.x > maxX) {
                maxX = p.x;
            };
            
            if (p.y < maxY) {
                maxY = p.y;
            };
            
            if (p.z < maxZ) {
                maxZ = p.z
            };
            
            var xOB = p.x - segment.start.x;
            var yOB = p.z - segment.start.z;
            var hypo = Math.sqrt(xOB * xOB + yOB * yOB);
            var cosAlpha = (xOA * xOB + yOA * yOB)/(Math.sqrt(xOA * xOA + yOA * yOA) * hypo);
            var alpha = Math.acos(cosAlpha);
            var dist = hypo * cosAlpha + totalDistance;
            if (!isNaN(dist)) {
                data.push({
                    'distance': dist,
                    'altitude': p.y,
                    'color': 'rgb(' + points.color[j][0] * 100 + '%,' + points.color[j][1] * 100 + '%,' + points.color[j][2] * 100 + '%)',
                    'intensity': 'rgb(' + points.intensity[j] + '%,' + points.intensity[j] + '%,' + points.intensity[j] + '%)',
                    // 'classification': 'rgb(' + points.classification[j][0] * 100 + '%,' + points.classification[j][1] * 100 + '%,' + points.classification[j][2] * 100 + '%)'
                });
            }
        }
        totalDistance += segmentLength;
    }
    
    var output = {
        'data': data,
        'minX': minX,
        'minY': minY,
        'minZ': minZ,
        'maxX': maxX,
        'maxY': maxY,
        'maxZ': maxZ
    }

    return output;
};
/***
* pv.profile.draw(data)
* Creates a D3 altitude profile
***/
pv.profile.draw = function () {
    
    // Get the profile'points, including attributes
    var output = pv.profile.getProfilePoints();
    var data = output.data;
    
    if (data.length === 0){
        return;
    }

    // Clear D3'elements = clear the chart
    d3.selectAll("svg").remove();
    
    var containerWidth = $('#profileContainer').width();
    var containerHeight = $('#profileContainer').height();
        
    var margin = {top: 10, right: 10, bottom: 20, left: 30},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;
    
    // Create the x/y scale functions
    // TODO: same x/y scale
    var x = d3.scale.linear()
        .range([0, width]);
    x.domain([d3.min(data, function(d) { return d.distance; }), d3.max(data, function(d) { return d.distance; })]);
    var y = d3.scale.linear()
        .range([height, 0]);
    y.domain([d3.min(data, function(d) { return d.altitude; }), d3.max(data, function(d) { return d.altitude; })]);

    // Create x/y axis
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10, "m");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "m");
        
    var zoom = d3.behavior.zoom()
    .x(x)
    .y(y)
    .on("zoom",  function(){

        // Zoom-Pan axis
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);
        // Zoom-Pan points
        svg.selectAll(".circle")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
        
        svg.selectAll("text")
            .style("fill", "white")
            .style("font-size", "8px")
            
    });

    var svg = d3.select("div#profileContainer").append("svg")
        .call(zoom)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
    // Append axis to the chart
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        

    svg.selectAll(".circle")
        .data(data)
        .enter().append("circle")
        .attr("class", "circle")
        .attr("cx", function(d) { return x(d.distance); })
        .attr("cy", function(d) { return y(d.altitude); })
        .attr("r", 1)
        .style("fill", function(d) {
            if (pv.params.pointColorType === Potree.PointColorType.RGB) {
                return d.color;
            } else if (pv.params.pointColorType === Potree.PointColorType.INTENSITY) {
                return d.intensity;
            } else if (pv.params.pointColorType === Potree.PointColorType.CLASSIFICATION) {
                // TODO: get the color map
                return d.color;
            } else {
                return d.color;
            }
        })
        .style("stroke", function(d) { 
            if (pv.params.pointColorType === Potree.PointColorType.RGB) {
                return d.color;
            } else if (pv.params.pointColorType === Potree.PointColorType.INTENSITY) {
                return d.intensity;
            } else if (pv.params.pointColorType === Potree.PointColorType.CLASSIFICATION) {
                // TODO: get the color map
                return d.color;
            } else {
                return d.color;
            }
        })
            
    svg.selectAll("text")
        .style("fill", "white");

    function reset() {
      svg.call(zoom
          .x(x.domain([-width / 2, width / 2]))
          .y(y.domain([-height / 2, height / 2]))
          .event);
    }

};
