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
            data.push([dist, p.y]);
        }
        totalDistance += segmentLength;
    }

    return data;
};
/***
* pv.profile.draw(data)
* Creates a Dygraph chart draw the points
***/
pv.profile.draw = function () {

    var data = pv.profile.getProfilePoints();
    
    if (data.length === 0){
        return;
    }

    pv.profile.chart = new Dygraph(
        "profileContainer",
        data,
        {
            legend: 'always',
            gridLineColor: '#F0F0F5',
            labels: [ "Distance", "Altitude"],                
            plotter:function(e) {
                    var ctx = e.drawingContext;
                    ctx.color = '#FF0000';
                    ctx.fillStyle = '#FF0000';
                    for (var i = 1; i < e.points.length; i++) {
                      var p = e.points[i];
                      ctx.fillRect(p.canvasx, p.canvasy, 3,3);
                    }
                }
        }
    );
};