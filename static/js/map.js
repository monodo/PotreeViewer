pv.initMapView = function () {

    // add EPSG:21781 to the proj4 projection database
    proj4.defs('EPSG:21781', "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs ");
    swiss = proj4.defs("EPSG:21781");
    WGS84 = proj4.defs("WGS84");
    webMercator = proj4.defs("EPSG:3857");

    // extent of the point cloud (with altitude) in EPSG:21781 / Swiss Coordinate System
    var minSwiss = [589500, 231300, 722.505];
    var maxSwiss = [590099, 231565.743, 776.459];

    // extent in EPSG:3857 / WGS84 Web Mercator 
    var minWeb = proj4(swiss, webMercator, [minSwiss[0], minSwiss[1]]);
    var maxWeb = proj4(swiss, webMercator, [maxSwiss[0], maxSwiss[1]]);

    var extent = [minWeb[0], minWeb[1], maxWeb[0], maxWeb[1]];
    var center = [(maxWeb[0] + minWeb[0]) / 2, (maxWeb[1] + minWeb[1]) / 2];

    // draw the extent as box inside the map view
    var box = new ol.geom.LineString([
        minWeb, [maxWeb[0], minWeb[1]], maxWeb, [minWeb[0], maxWeb[1]], minWeb
    ]);

    var feature = new ol.Feature(box);
    var featureVector = new ol.source.Vector({
        features: [feature]
    });

    var extentLayer = new ol.layer.Vector({
        source: featureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                color: '#000000'
                })
            })
        })
    });

    if (!visibleBounds) {
        visibleBounds = new ol.geom.LineString([
            minWeb, [maxWeb[0], minWeb[1]], maxWeb, [minWeb[0], maxWeb[1]], minWeb
        ]);
        var visibleBoundsFeature = new ol.Feature(visibleBounds);
    }

    var visibleBoundsLayer = new ol.layer.Vector({
        source: featureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                  color: '#0000ff',
                  width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: '#0000ff'
                })
            })
        })
    });

    camFrustumFeatureVector = new ol.source.Vector({
        features: []
    });

    var camFrustumLayer = new ol.layer.Vector({
        source: camFrustumFeatureVector,
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: '#000000',
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 3,
                fill: new ol.style.Fill({
                    color: '#000000'
                })
            })
        })
    });

    // create the map
    pv.map = new ol.Map({
        controls: ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }).extend([
            new ol.control.ZoomToExtent({
                extent: extent,
                closest: true
            })
        ]),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            }),
            extentLayer,
            visibleBoundsLayer,
            camFrustumLayer
        ],
        target: 'map',
        view: new ol.View({
            center: center,
            zoom: 15
        })
    });
};
    
/**
 * update the frustum in the map window according to the camera
 */
function updateMapFrustum(){

    pv.map.camFrustum = new ol.geom.LineString([ [0,0], [0, 0] ]);

    var feature = new ol.Feature(pv.map.camFrustum);
    camFrustumFeatureVector.clear();
    camFrustumFeatureVector.addFeature(feature);

    var aspect = camera.aspect;
    var top = Math.tan( THREE.Math.degToRad( camera.fov * 0.5 ) ) * camera.near;
    var bottom = - top;
    var left = aspect * bottom;
    var right = aspect * top;

    var camPos = new THREE.Vector3(0, 0, 0);
    left = new THREE.Vector3(left, 0, -camera.near).multiplyScalar(3000);
    right = new THREE.Vector3(right, 0, -camera.near).multiplyScalar(3000);
    camPos.applyMatrix4(camera.matrixWorld);
    left.applyMatrix4(camera.matrixWorld);
    right.applyMatrix4(camera.matrixWorld);
    camPos = pv.toGeo(camPos);
    left = pv.toGeo(left);
    right = pv.toGeo(right);

    camPos = proj4(swiss, webMercator, [camPos.x, camPos.y]);
    left = proj4(swiss, webMercator, [left.x, left.y]);
    right = proj4(swiss, webMercator, [right.x, right.y]);

    pv.map.camFrustum.setCoordinates([camPos, left, right, camPos]);
}

/**
 * update the map extent in the map window
 */
pv.updateMapExtent = function(){
    var geoExtent = pv.toGeo(pointcloud.getVisibleExtent());
    
    var geoMin = proj4(swiss, webMercator, [geoExtent.min.x, geoExtent.min.y]);
    var geoMax = proj4(swiss, webMercator, [geoExtent.max.x, geoExtent.max.y]);

    visibleBounds.setCoordinates([
        geoMin,
        [geoMax[0], geoMin[1]],
        geoMax,
        [geoMin[0], geoMax[1]],
        geoMin
    ]);
};
