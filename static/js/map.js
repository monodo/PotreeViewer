/*** 
* Initialize the OL3 2D map 
* Method: initMapView
* Parameters: none
***/
pv.map2D.initMapView = function () {

    // Base layers' attributions
    this.attributions = new ol.Attribution({
        html: pv.params.mapconfig.attributionsHtml
    });

    // From their CRS, get the projection system of the pointcloud and the 2D map
    this.mapProjection = ol.proj.get(pv.params.mapconfig.mapCRS);
    this.mapProjection.setExtent(pv.params.mapconfig.projectionExtent);
    this.pointCloudProjection = ol.proj.get(pv.params.mapconfig.pointCloudCRS);

    // Extent of the point cloud (with altitude)
    var pointCloudExtentMin = pv.params.mapconfig.pointCloudExtentMin;
    var pointCloudExtentMax = pv.params.mapconfig.pointCloudExtentMax;

    // Point cloud extent in map CRS
    var minWebCloud = ol.proj.transform([pointCloudExtentMin[0],pointCloudExtentMin[1]], this.pointCloudProjection, this.mapProjection );
    var maxWebCloud = ol.proj.transform([pointCloudExtentMax[0],pointCloudExtentMax[1]], this.pointCloudProjection, this.mapProjection );
    var pointCloudExtent = [minWebCloud[0], minWebCloud[1], maxWebCloud[0], maxWebCloud[1]];
    var pointCloudCenter = [(maxWebCloud[0] + minWebCloud[0]) / 2, (maxWebCloud[1] + minWebCloud[1]) / 2];

    // Layer used to draw the point cloud extent
    var box = new ol.geom.LineString([
        minWebCloud, [maxWebCloud[0], minWebCloud[1]], maxWebCloud, [minWebCloud[0], maxWebCloud[1]], minWebCloud
    ]);

    var feature = new ol.Feature(box);
    var featureVector = new ol.source.Vector({
        features: [feature]
    });

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

    // Layer used to display the tools drawings in 2D
    this.toolLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
        }),
        style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 0, 0, 1)'
            }),
            stroke: new ol.style.Stroke({
                  color: 'rgba(255, 0, 0, 1)',
                  width: 2
            })
        })
    });

    this.camFrustumFeatureVector = new ol.source.Vector({
        features: []
    });

    var camFrustumLayer = new ol.layer.Vector({
        source: this.camFrustumFeatureVector,
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

    var extent = pv.params.mapconfig.mapExtent;

    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(4),
        projection: pv.params.mapconfig.mapCRS,
        undefinedHTML: '&nbsp;'
    });

    this.map = new ol.Map({
        controls: [
            new ol.control.ScaleLine(),
            mousePositionControl
        ],
        layers: [
            this.toolLayer,
            visibleBoundsLayer,
            camFrustumLayer
        ],
        target: 'map',
        view: new ol.View({
            projection: this.mapProjection,
            center: pointCloudCenter,
            extent: extent,
            zoom: pv.params.mapconfig.initialZoom
        })
    });

    // Base layers can be WMS of WMTS, depending of config/config.js file
    if (pv.params.mapconfig.mapServiceType == 'WMTS') {

        var parser = new ol.format.WMTSCapabilities();

        $.ajax(pv.params.mapconfig.wmtsGetCapabilities).then(function(response) {
            var result = parser.read(response);
            // Generate layer list from getCapabilities file
            for (var i=0; i < result.Contents.Layer.length; i++){
                var val = result.Contents.Layer[i].Title;
                var key = result.Contents.Layer[i].Identifier;
                var option = new Option(val, key);
                option.setAttribute("Imageformat", result.Contents.Layer[i].Format[0]);
                if (key == pv.params.mapconfig.mapDefaultLayer){
                    option.setAttribute("selected", "selected");
                }
                $("#layerSelector").append(option);
            }

            $("#layerSelector").selectmenu( "refresh" );

            pv.map2D.WMTSOptions = ol.source.WMTS.optionsFromCapabilities(
                result,
                {
                    layer: pv.params.mapconfig.mapDefaultLayer, 
                    matrixSet: pv.params.mapconfig.mapCRS
                });

            pv.map2D.baseLayer = new ol.layer.Tile({
                opacity: 1,
                source: new ol.source.WMTS(pv.map2D.WMTSOptions)
            });

            var layersCollection = pv.map2D.map.getLayers();
            layersCollection.insertAt(0, pv.map2D.baseLayer);

        });

    } else {
        // WMS
        this.baseLayer = new ol.layer.Image({
            extent: extent,
            source: new ol.source.ImageWMS({
                attributions: [this.attributions],
                url: pv.params.mapconfig.mapServiceUrl,
                params: {'LAYERS': pv.params.mapconfig.mapDefaultLayer},
                serverType: /** @type {ol.source.wms.ServerType} */ ('mapserver')
            })
        });

        var layersCollection = this.map.getLayers();
        layersCollection.insertAt(0, this.baseLayer);
    }

};

/***
 * update the frustum in the map window according to the pv.scene3D.camera
 * Method: updateMapFrustum
 * Parameters: none
 */
pv.map2D.updateMapFrustum = function (){
    this.camFrustum = new ol.geom.LineString([ [0,0], [0, 0] ]);
    var feature = new ol.Feature(this.camFrustum);
    this.camFrustumFeatureVector.clear();
    this.camFrustumFeatureVector.addFeature(feature);

    var aspect = pv.scene3D.camera.aspect;
    var top = Math.tan( THREE.Math.degToRad( pv.scene3D.camera.fov * 0.5 ) ) * pv.scene3D.camera.near;
    var bottom = - top;
    var left = aspect * bottom;
    var right = aspect * top;

    var camPos = new THREE.Vector3(0, 0, 0);
    left = new THREE.Vector3(left, 0, -pv.scene3D.camera.near).multiplyScalar(3000);
    right = new THREE.Vector3(right, 0, -pv.scene3D.camera.near).multiplyScalar(3000);
    camPos.applyMatrix4(pv.scene3D.camera.matrixWorld);
    left.applyMatrix4(pv.scene3D.camera.matrixWorld);
    right.applyMatrix4(pv.scene3D.camera.matrixWorld);
    camPos = pv.utils.toGeo(camPos);
    left = pv.utils.toGeo(left);
    right = pv.utils.toGeo(right);
    camPos = ol.proj.transform([camPos.x, camPos.y], this.pointCloudProjection, this.mapProjection );
    left = ol.proj.transform([left.x, left.y], this.pointCloudProjection, this.mapProjection );
    right = ol.proj.transform([right.x, right.y], this.pointCloudProjection, this.mapProjection );

    this.camFrustum.setCoordinates([camPos, left, right, camPos]);

};

/***
* Update the map extent in the map window
* Method: updateMapExtent
* Parameters: none
***/
pv.map2D.updateMapExtent = function(){

    var geoExtent = pv.utils.toGeo(pv.scene3D.pointcloud.getVisibleExtent());
    var geoMin = ol.proj.transform([geoExtent.min.x, geoExtent.min.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );
    var geoMax = ol.proj.transform([geoExtent.max.x, geoExtent.max.y], pv.map2D.pointCloudProjection, pv.map2D.mapProjection );

};

/***
* Update the profile path on the 2D map
* Method: updateToolLayer
* Parameters: Potree.profile (active profile);
***/
pv.map2D.updateToolLayer = function (toolVertices) {

    if (!toolVertices){
        return;
    }

    var lineString = [];
    for (var i=0; i<toolVertices.length; i++) {
        var p = toolVertices[i];
        var pGeo = pv.utils.toGeo(p);
        lineString.push([pGeo.x, pGeo.y]);
    }

    var line = new ol.geom.LineString(lineString);
    var feature = new ol.Feature(line);
    this.toolLayer.getSource().clear();
    this.toolLayer.getSource().addFeature(feature);
    this.map.getView().fitExtent(pv.map2D.toolLayer.getSource().getExtent(), pv.map2D.map.getSize());
};
