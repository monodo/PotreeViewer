/***
* Method: initialize the Three 3D scene objects
* Parameters: none
***/
pv.scene3D.initThree = function (){

    pv.ui.elRenderArea = document.getElementById("renderArea");
    var width = pv.ui.elRenderArea.clientWidth;
    var height = pv.ui.elRenderArea.clientHeight;
    var aspect = width / height;
    pv.ui.progressBar = new ProgressBar();

    pv.scene3D.clock = new THREE.Clock();
    pv.scene3D.mouse = {x: 0, y: 0};
    pv.scene3D.scene = new THREE.Scene();
    pv.scene3D.scenePointCloud = new THREE.Scene();
    pv.scene3D.sceneBG = new THREE.Scene();

    pv.scene3D.camera = new THREE.PerspectiveCamera(pv.params.fov, aspect, pv.params.near, pv.params.far);
    pv.scene3D.cameraBG = new THREE.Camera();
    pv.scene3D.camera.rotation.order = pv.params.cameraRotationOrder;

    pv.scene3D.referenceFrame = new THREE.Object3D();
    pv.scene3D.scenePointCloud.add(pv.scene3D.referenceFrame);

    pv.scene3D.renderer = new THREE.WebGLRenderer();
    pv.scene3D.renderer.setSize(width, height);
    pv.scene3D.renderer.autoClear = pv.params.autoclear;
    pv.ui.elRenderArea.appendChild(pv.scene3D.renderer.domElement);

    pv.scene3D.skybox = Potree.utils.loadSkybox(pv.params.skyboxPath);
    
    // pv.scene3D.camera and controls
    pv.scene3D.camera.position.set(pv.params.cameraPosition.x, pv.params.cameraPosition.y, pv.params.cameraPosition.z);
    pv.scene3D.camera.rotation.y = -Math.PI / 4;
    pv.scene3D.camera.rotation.x = -Math.PI / 6;
    pv.utils.useOrbitControls();

    // enable frag_depth extension for the interpolation shader, if available
    pv.scene3D.renderer.context.getExtension("EXT_frag_depth");

    // load pv.scene3D.pointcloud
    POCLoader.load(pv.params.pointCloudPath, function(geometry){
        pv.scene3D.pointcloud = new Potree.PointCloudOctree(geometry);
        pv.scene3D.pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pv.scene3D.pointcloud.material.size = pv.params.pointSize;
        pv.scene3D.pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pv.scene3D.pointcloud.material.maxSize = pv.params.adaptiveMaxSize;
        if (pv.params.customGradient) {
            pv.scene3D.pointcloud.material.gradient = pv.params.customGradient;
        }
        if (pv.params.customClassification) {
            pv.scene3D.pointcloud.material.classification = pv.params.customClassification;
        }
        pv.scene3D.referenceFrame.add(pv.scene3D.pointcloud);

        pv.scene3D.referenceFrame.updateMatrixWorld(pv.params.updateMatrixWorld);
        var sg = pv.scene3D.pointcloud.boundingSphere.clone().applyMatrix4(pv.scene3D.pointcloud.matrixWorld);

        pv.scene3D.referenceFrame.position.copy(sg.center).multiplyScalar(-1);
        pv.scene3D.referenceFrame.updateMatrixWorld(pv.params.updateMatrixWorld);
        pv.scene3D.camera.zoomTo(pv.scene3D.pointcloud, pv.params.defaultZoomLevel);
        pv.utils.flipYZ();
        pv.utils.useEarthControls();
        pv.scene3D.earthControls.pointclouds.push(pv.scene3D.pointcloud);

    });

    var grid = Potree.utils.createGrid(5, 5, 2);
    pv.scene3D.scene.add(grid);

    pv.scene3D.measuringTool = new Potree.MeasuringTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.profileTool = new Potree.ProfileTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.profileTool.addEventListener("marker_added", pv.profile.draw);

    pv.scene3D.volumeTool = new Potree.VolumeTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);
    pv.scene3D.transformationTool = new Potree.TransformationTool(pv.scene3D.scenePointCloud, pv.scene3D.camera, pv.scene3D.renderer);

    var texture = Potree.utils.createBackgroundTexture(512, 512);

    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;

    var bg = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2, 0),
        new THREE.MeshBasicMaterial({
            map: texture
        })
    );

    bg.material.depthTest = false;
    bg.material.depthWrite = false;
    pv.scene3D.sceneBG.add(bg);

    window.addEventListener( 'keydown', pv.utils.onKeyDown, false );
    pv.scene3D.renderer.domElement.addEventListener( 'mousemove', pv.utils.onMouseMove, false );
};
