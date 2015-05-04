/**
* Set up global viewer parameters here
*/

pv.params = {
    'versionInfo': '<a href="http://sitn.ne.ch/" target="_blank">SITN</a> Potree Viewer <b><i>Beta</i></b>',
    'near': 10,
    'far': 1000000,
    'fov': 50,
    'skyboxPath': 'static/libs/potree/resources/textures/skybox/',
    'autoclear': false,
    'constrolMoveSpeedFactor': 250,
    'constrolMoveSpeedFactorMin': 40,
    'constrolMoveSpeedFactorMax': 1000,
    'constrolMoveSpeedFactorStep': 1,
    'cameraPosition': {
        'x': 0,
        'y': 25,
        'z': 0
    },
    'cameraRotationOrder': 'ZYX',
    'useDEMCollisions': true,
    'pointSize': 1,
    'pointSizeMin': 0,
    'pointSizeMax': 2,
    'pointSizeStep': 0.1,
    'pointSizeType': Potree.PointSizeType.ADAPTIVE,
    'adaptiveMaxSize': 2,
    'pointShape': Potree.PointShape.SQUARE,
    'pointQuality': 'Normal',
    'pointCountTarget': 0.2,
    'pointCountTargetMin': 0.1,
    'pointCountTargetMax': 20,
    'pointCountTargetStep': 0.1,
    'pointColorType': Potree.PointColorType.RGB,
    'pointCountTargetFactor': 1000000,
    'showOctree': false,
    'material': 'RGB',
    'interpolate': false,
    'circles': false,
    'showCoordinates': false,
    'showPointNumber': false,
    'showSkyBox': false,
    'showProgressBar': true,
    'opacity': 1,
    'opacityMin': 0.1,
    'opacityMax': 1,
    'opacityStep': 0.1,
    'pointCloudPath': 'cloud/potree_v16/resources/pointclouds/CH03_LN02/cloud.js',
    'isPointCloudGeoreferenced': true,
    'BoundingBox': false,
    'isFlipYZ': false,
    'showFlipYZ': false,
    'updateMatrixWorld': true,
    'defaultZoomLevel': 1,
    'profileWidth': 20,
    'profileWidthMin': 0.1,
    'profileWidthMax': 500,
    'profileWidthStep': 0.1,
    'profilePointSize': 2,
    'profilePointLOD': 3,
    'profilePointMaxLOD': 10,
    'profilePointSizeMin': 0.1,
    'profilePointSizeMax': 20,
    'profilePointSizeStep': 0.1,
    'clipMode': Potree.ClipMode.HIGHLIGHT_INSIDE, 
    'defaultLanguage': 'en',
    'availableLanguages': {
        'fr': 'Fr',
        'en': 'En', 
        'de': 'De'},
    'defaultPointSizeType': Potree.PointSizeType.ADAPTIVE,
    'pointSizeTypes': {
        'fixed': Potree.PointSizeType.FIXED,
        'attenuated': Potree.PointSizeType.ATTENUATED,
        'adaptive': Potree.PointSizeType.ADAPTIVE
    }, 
    'defaultPointQuality': 'Interpolation',
    'pointQualityTypes': {
        'Normal': 'Normal',
        'Circles': 'Circles',
        'Interpolation': 'Interpolation',
        'Splats': 'Splats'
    },
    'defaultPointMaterial':Potree.PointColorType.RGB,
    // Materials type: outcomment availables ones (depends on used parameters for conversion)
    'pointMaterialTypes': {
        'rgb': Potree.PointColorType.RGB,
        //'color': Potree.PointColorType.COLOR,
        'height': Potree.PointColorType.HEIGHT,
        'intensity': Potree.PointColorType.INTENSITY,
        'intensity_gradient': Potree.PointColorType.INTENSITY_GRADIENT,
        'classification': Potree.PointColorType.CLASSIFICATION,
        //'return_number': Potree.PointColorType.RETURN_NUMBER,
        'octree_depth': Potree.PointColorType.OCTREE_DEPTH
        //'point_index': Potree.PointColorType.POINT_INDEX
    },
    'defaultPointClip': Potree.ClipMode.HIGHLIGHT_INSIDE,
    'pointClipTypes': {
        'no_clipping': Potree.ClipMode.DISABLED,
        'outside': Potree.ClipMode.CLIP_OUTSIDE,
        'inside': Potree.ClipMode.HIGHLIGHT_INSIDE
    },
    'mapconfig': {
        /***IMPORTANT: when using other projections than EPSG 3857 or 4326, 
        /* you must edit index.html to load alternative projection from epsg.io
        ***/
        'pointCloudCRS': 'EPSG:21781', // CRS of the point cloud
        'pointCloudExtentMin': [550000, 200000, 0], // point cloud LL corner in point cloud CRS
        'pointCloudExtentMax': [560000, 220000, 1700], // point cloud UR corner in point cloud CRS
        'mapExtent': [523000, 190000, 580000, 224500], // initial map extent at loading in map CRS
        'initialZoom': 4, // Initial map zoom
        'attributionsHtml': 'Tiles &copy; <http://ne.ch/sitn">SITN</a>', // map's attributions
        'mapCRS': 'EPSG:21781', // Map's CRS
        'projectionExtent': [485869.5728, 76443.1884, 837076.5648, 299941.7864], // Map's project extent
        'mapServiceType': 'WMTS', // Possible values: [WMS, WMTS]
        /*** 
        * WMTS Configuration only (automatic, production)
        * Configuration gets loaded from local wmtsGetCapabilities xml file or URL.
        * Beware of cross-domain request errors...
        ***/
        'wmtsGetCapabilities': 'config/wmtsconfig.xml',
        'mapDefaultLayer': 'plan_ensemble_couleur',
        /*** 
        * WMS Configuration only (manual, dev purposes)
        ***/
        'layers': {
            'plan_ensemble_couleur': 'Plan d\'ensemble couleur',
            'topo': 'Carte topographique',
            'ortho2011': 'Orthophoto 2011',
            'mnt2010': 'MNT 2010',
            'mns2010': 'MNS 2010',
            'densitelidar2010': 'Densité LiDAR 2010'
        },
        'mapServiceUrl': 'http://sitn.ne.ch/mapproxy/service',
        'mapServiceImageFormat': 'image/png'
    }
};
