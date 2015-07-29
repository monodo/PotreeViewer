/*** 
* initialize the Three 3D scene objects
* Method: initThree
* Parameters: none
***/
pv.scene3D.initThree = function (){

    // Get the html target element (DIV)
    pv.ui.elRenderArea = document.getElementById("renderArea");

    // 3D scene dimensions
    var width = pv.ui.elRenderArea.clientWidth;
    var height = pv.ui.elRenderArea.clientHeight;
    var aspect = width / height;

    // Progress bar for octree loading
    pv.ui.progressBar = new ProgressBar();

    this.clock = new THREE.Clock();
    this.mouse = {x: 0, y: 0};
    this.scene = new THREE.Scene();
    this.scenePointCloud = new THREE.Scene();
    this.sceneBG = new THREE.Scene();

    // Set up cameras
    this.camera = new THREE.PerspectiveCamera(pv.params.fov, aspect, pv.params.near, pv.params.far);
    this.cameraBG = new THREE.Camera();
    this.camera.rotation.order = pv.params.cameraRotationOrder;

    this.referenceFrame = new THREE.Object3D();
    this.scenePointCloud.add(pv.scene3D.referenceFrame);

    // Renderer
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    this.renderer.autoClear = pv.params.autoclear;
    pv.ui.elRenderArea.appendChild(this.renderer.domElement);

    // Skybox
    this.skybox = Potree.utils.loadSkybox(pv.params.skyboxPath);

    // pv.scene3D.camera and controls
    this.camera.position.set(pv.params.cameraPosition.x, pv.params.cameraPosition.y, pv.params.cameraPosition.z);
    this.camera.rotation.y = -Math.PI / 4;
    this.camera.rotation.x = -Math.PI / 6;
    pv.utils.useOrbitControls();

    // Enable frag_depth extension for the interpolation shader, if available
    this.renderer.context.getExtension("EXT_frag_depth");

    // Load octree geometry
    POCLoader.load(pv.params.pointCloudPath, pv.scene3D.PCOLoaderfunction);

    // Octree grid
    var grid = Potree.utils.createGrid(5, 5, 2);
    this.scene.add(grid);

    // Tools set up
    this.measuringTool = new Potree.MeasuringTool(this.scenePointCloud, this.camera, this.renderer);
    this.measuringTool.addEventListener("insertion_finished", function(event){
        pv.ui.clearTools();
    });

    this.profileTool = new Potree.ProfileTool(this.scenePointCloud, this.camera, this.renderer);
    this.profileTool.addEventListener("insertion_finished", function(){
        pv.profile.setState(true);
        pv.profile.draw();
        $('#radioProfile').prop('checked', false).button("refresh");

        pv.scene3D.profileTool.addEventListener("marker_moved", function(){
            pv.profile.markerMoved = true;
        });
    });
    this.profileTool.addEventListener("marker_added", function(){
        pv.profile.setState(false);
    });

    this.volumeTool = new Potree.VolumeTool(this.scenePointCloud, this.camera, this.renderer);
    transformationTool = new Potree.TransformationTool(this.scenePointCloud, this.camera, this.renderer);
    this.volumeTool.addEventListener("insertion_finished", function(event){
        pv.ui.clearTools();
    });

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
    this.sceneBG.add(bg);

    window.addEventListener( 'keydown', pv.utils.onKeyDown, false );
    this.renderer.domElement.addEventListener( 'mousemove', pv.utils.onMouseMove, false );

};

/***
* Loads Potree POint Cloud Octree Geometry
* Method: PCOLoaderfunction
* Parameters: geometry
***/
pv.scene3D.PCOLoaderfunction = function(geometry){

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
    pv.utils.useOrbitControls();
    
    if (pv.params.useDEMCollisions){
        pv.scene3D.pointcloud.generateDEM = true;
        pv.scene3D.orbitControls.addEventListener("proposeTransform", pv.utils.demCollisionHandler);
    }
};

