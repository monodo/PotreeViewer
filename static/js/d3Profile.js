/***
* Parse the profile's points and project them along the profile's segments
***/
pv.profile.getProfilePoints = function(){

    var profile = pv.scene3D.profileTool.profiles[pv.scene3D.profileTool.profiles.length - 1];
    var segments = pv.scene3D.pointcloud.getPointsInProfile(profile, 2);
    var data = [];
    var distance = 0;
    var totalDistance = 0;

    for(var i = 0; i < segments.length; i++){
        var segment = segments[i];        
        var xOA = segment.end.x - segment.start.x;
        var yOA = segment.end.z - segment.start.z;
        var segmentLength = Math.sqrt(xOA * xOA + yOA * yOA);
        var points = segment.points;
        // TODO: add attribute support
        for(var j = 0; j < points.numPoints; j++){
            var p = points.position[j];
            var xOB = p.x - segment.start.x;
            var yOB = p.z - segment.start.z;
            var hypo = Math.sqrt(xOB * xOB + yOB * yOB);
            var cosAlpha = (xOA * xOB + yOA * yOB)/(Math.sqrt(xOA * xOA + yOA * yOA) * hypo);
            var alpha = Math.acos(cosAlpha);
            var dist = hypo * cosAlpha + totalDistance;
            data.push({
                'distance': dist,
                'altitude': p.y,
                'color': 'rgb(' + points.color[j][0] * 100 + '%,' + points.color[j][1] * 100 + '%,' + points.color[j][2] * 100 + '%)'
            });
        }
        totalDistance += segmentLength;
    }

    return data;
};
/***
* pv.profile.draw(data)
* Creates a D3 altitude profile
***/
pv.profile.draw = function () {
    
    // Get the profile'points, inclusive attributes
    var data = pv.profile.getProfilePoints();
    
    if (data.length === 0){
        return;
    }

    d3.selectAll("svg").remove();
    var containerWidth = $('#profileContainer').width();
    var containerHeight = $('#profileContainer').height();
        
    var margin = {top: 10, right: 10, bottom: 20, left: 30},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;
        
    var x = d3.scale.linear()
        .range([0, width]);
    x.domain([d3.min(data, function(d) { return d.distance; }), d3.max(data, function(d) { return d.distance; })]);
    var y = d3.scale.linear()
        .range([height, 0]);
    y.domain([d3.min(data, function(d) { return d.altitude; }), d3.max(data, function(d) { return d.altitude; })]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10, "m");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "m");

    svg = d3.select("div#profileContainer").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // x.domain(data.map(function(d) { return d.distance; }));
        // y.domain([0, d3.max(data, function(d) { return d.altitude; })]);


    svg.append("g")
        .attr("class", "x axis")
        //.attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    svg.selectAll(".bar")
        .data(data)
        .enter().append("circle")
        .attr("class", "bar")
        .attr("cx", function(d) { return x(d.distance); })
        .attr("cy", function(d) { return y(d.altitude); })
        .attr("r", 1)
        .style("fill", function(d) { return d.color});
};