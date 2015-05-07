/***
* Parse the profile's points and project them along the profile's segments
* Method: getProfilePoints
* Parameters: none
***/
pv.profile.getProfilePoints = function(){

    var profile = pv.scene3D.profileTool.profiles[pv.scene3D.profileTool.profiles.length - 1];
    var segments = pv.scene3D.pointcloud.getPointsInProfile(profile, $("#profilePointLODSlider").slider( "value" ));
    if (segments.length < 1){
        return false;
    }
    var data = [];
    var distance = 0;
    var totalDistance = 0;
    var minX = Math.max();
    var minY = Math.max();
    var minZ = Math.max();
    var maxX = 0;
    var maxY = 0;
    var maxZ = 0;

    // Get the same color map as Three
    var minRange = pv.utils.toGeo(new THREE.Vector3(0, pv.scene3D.pointcloud.material.heightMin, 0));
    var maxRange = pv.utils.toGeo(new THREE.Vector3(0, pv.scene3D.pointcloud.material.heightMax, 0));
    var heightRange = maxRange.z - minRange.z;
    var colorRange = [];
    var colorDomain = [];

    // Read the altitude gradient used in 3D scene
    for (var c=0; c<pv.scene3D.pointcloud.material.gradient.length; c++){
        colorDomain.push(minRange.z + heightRange * pv.scene3D.pointcloud.material.gradient[c][0]);
        colorRange.push('#' + pv.scene3D.pointcloud.material.gradient[c][1].getHexString());
    }

    // Altitude color map scale
    var colorRamp = d3.scale.linear()
      .domain(colorDomain)
      .range(colorRange);

    // Iterate the profile's segments
    for(var i = 0; i < segments.length; i++){
        var segment = segments[i];
        var segStartGeo = pv.utils.toGeo(segment.start);
        var segEndGeo = pv.utils.toGeo(segment.end);
        var xOA = segEndGeo.x - segStartGeo.x;
        var yOA = segEndGeo.y - segStartGeo.y;
        var segmentLength = Math.sqrt(xOA * xOA + yOA * yOA);
        var points = segment.points;

        // Iterate the segments' points
        for(var j = 0; j < points.numPoints; j++){

            var p = pv.utils.toGeo(points.position[j]);
            // get min/max values            
            if (p.x < minX) { minX = p.x;}

            if (p.y < minY) { minY = p.y;}

            if (p.z < minZ) { minZ = p.z;}

            if (p.x > maxX) { maxX = p.x;}

            if (p.y < maxY) { maxY = p.y;}

            if (p.z < maxZ) { maxZ = p.z;}

            var xOB = p.x - segStartGeo.x;
            var yOB = p.y - segStartGeo.y;
            var hypo = Math.sqrt(xOB * xOB + yOB * yOB);
            var cosAlpha = (xOA * xOB + yOA * yOB)/(Math.sqrt(xOA * xOA + yOA * yOA) * hypo);
            var alpha = Math.acos(cosAlpha);
            var dist = hypo * cosAlpha + totalDistance;
            if (!isNaN(dist)) {
                data.push({
                    'distance': dist,
                    'x': p.x,
                    'y': p.y,
                    'altitude': p.z,
                    'color': 'rgb(' + points.color[j][0] * 100 + '%,' + points.color[j][1] * 100 + '%,' + points.color[j][2] * 100 + '%)',
                    'intensity': 'rgb(' + points.intensity[j] + '%,' + points.intensity[j] + '%,' + points.intensity[j] + '%)',
                    'intensityCode': points.intensity[j],
                    'heightColor': colorRamp(p.z),
                    'classificationCode': points.classification[i]
                });
            }
        }

        // Increment distance from the profile start point
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
    };

    return output;
};

/***
* Creates a D3 altitude profile
* Method: draw
* Parameters: none
***/
pv.profile.draw = function () {

    if (!pv.profile.state){
            return;
    }

    var pointSize = $("#profilePointSizeSlider").slider( "value" );
    var thePoints = pv.scene3D.profileTool.profiles[pv.scene3D.profileTool.profiles.length - 1].points;

    pv.map2D.updateToolLayer(thePoints);

    var output = pv.profile.getProfilePoints();

    if (!output){
        return;
    }

    var data = output.data;

    if (data.length === 0){
        return;
    }

    // Clear D3'elements = clear the chart
    d3.selectAll("svg").remove();

    var containerWidth = $('#profileContainer').width();
    var containerHeight = $('#profileContainer').height();

    var margin = {top: 25, right: 10, bottom: 20, left: 40},
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Create the x/y scale functions
    // TODO: same x/y scale

    // X scale
    var x = d3.scale.linear()
        .range([5, width -5]);
    x.domain([d3.min(data, function(d) { return d.distance; }), d3.max(data, function(d) { return d.distance; })]);

    // Y scale
    var y = d3.scale.linear()
        .range([height -5, 5]);
    y.domain([d3.min(data, function(d) { return d.altitude; }), d3.max(data, function(d) { return d.altitude; })]);

    // Create x axis
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(10, "m");

    // Create y axis
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10, "m");

    // Zoom behaviour
    pv.profile.zoom = d3.behavior.zoom()
        .x(x)
        .y(y)
        .on("zoom",  function(){

    var t = pv.profile.zoom.translate();
    var tx = t[0];
    var ty = t[1];

    tx = Math.min(tx, 0);
    tx = Math.max(tx, width - output.maxX);
    pv.profile.zoom.translate([tx, ty]);

    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);

    pv.profile.drawPoints(output.data, svg, x, y, pointSize);

    svg.selectAll("text")
        .style("fill", "white")
        .style("font-size", "8px");

    });

    var svg = d3.select("div#profileContainer").append("svg")
        .call(pv.profile.zoom)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height);

    // Append axis to the chart
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    pv.profile.drawPoints(output.data, svg, x, y, pointSize);

    svg.selectAll("text")
        .style("fill", "white");

    // Everything ready, show the containers;
    pv.map2D.updateMapSize(true);
    $("#profileContainer").slideDown(300);

};

/***
* Reset the profile zoom and pan
* Method: resetPanZoom
* Parameters: none
***/
pv.profile.resetPanZoom = function reset() {
    pv.profile.draw();
};

/***
* Manual zoom
* Method: manualZoom
* Parameters: none
***/
pv.profile.manualZoom = function (increment) {

    var currentScale = pv.profile.zoom.scale();
    var nextScale = currentScale + increment;
    if (nextScale > 0) {
        pv.profile.zoom.scale([nextScale]);
        pv.profile.zoom.event(d3.select("div#profileContainer"));
    } else {
        pv.profile.zoom.scale([1]);
        pv.profile.zoom.event(d3.select("div#profileContainer"));
    }
};

/***
* Draw the profile points with specific colors and style settings
* Method: drawPoints
* Parameters: none
***/
pv.profile.drawPoints = function(data, svg, x, y, psize) {

        d3.selectAll(".circle").remove();
        svg.selectAll(".circle")
            .data(data)
            .enter().append("circle")
            .attr("class", "circle")
            .attr("cx", function(d) { return x(d.distance); })
            .attr("cy", function(d) { return y(d.altitude); })
            .attr("r", psize)
            .on("mouseover", pv.profile.pointHighlightEvent)
            .on("mouseout", function(d){
                $('#profileInfo').html('');
                d3.select(this)
                    .style("stroke", pv.profile.strokeColor);
            })
            .style("fill", pv.profile.strokeColor)
            .style("stroke-width", 3)
            .style("stroke", pv.profile.strokeColor);
};

/***
* Handle the mouseover event on the profile's points
* Method: pointHighlightEvent
* Parameters: data
***/
pv.profile.pointHighlightEvent = function (d) {

    d3.select(this)
        .style("stroke", "yellow");

    var html = 'x: ' + Math.round(10 * d.x) / 10 + ' y: ' + Math.round(10 * d.y) / 10 + ' z: ' + Math.round( 10 * d.y) / 10 + '  -  ';
    html += i18n.t('tools.classification') + ': ' + d.classificationCode + '  -  ';
    html += i18n.t('tools.intensity') + ': ' + d.intensityCode;

    $('#profileInfo').html(html);

};

/***
* Define the points color depending on rendering colors
* Method: strokeColor
* Parameters: data
***/
pv.profile.strokeColor = function (d) {
    if (pv.params.pointColorType === Potree.PointColorType.RGB) {
        return d.color;
    } else if (pv.params.pointColorType === Potree.PointColorType.INTENSITY) {
        return d.intensity;
    } else if (pv.params.pointColorType === Potree.PointColorType.CLASSIFICATION) {
        var classif = pv.scene3D.pointcloud.material.classification;
        var color = 'rgb(' + classif[d.classificationCode].r * 100 + '%,';
        color += classif[d.classificationCode].g * 100 + '%,';
        color += classif[d.classificationCode].b * 100 + '%)';
        return color;
    } else if (pv.params.pointColorType === Potree.PointColorType.HEIGHT) {
        return d.heightColor;
    } else {
        return d.color;
    }
};

/***
* Keep track of the profile state
* Method: setState
* Parameter: Boolean
***/
pv.profile.setState = function(state){
    this.state = state;
}