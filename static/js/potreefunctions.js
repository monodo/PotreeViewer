	/**
	 * transform from geo coordinates to local scene coordinates
	 */
	function toLocal(position){
		var scenePos = position.clone().applyMatrix4(referenceFrame.matrixWorld);
		return scenePos;
	}

/**
 * transform from local scene coordinates to geo coordinates
 */
pv.toGeo = function(object){
    var geo;
    var inverse = new THREE.Matrix4().getInverse(referenceFrame.matrixWorld);
    
    if(object instanceof THREE.Vector3){	
        geo = object.clone().applyMatrix4(inverse);
    }else if(object instanceof THREE.Box3){
        var geoMin = object.min.clone().applyMatrix4(inverse);
        var geoMax = object.max.clone().applyMatrix4(inverse);
        geo = new THREE.Box3(geoMin, geoMax);
    }

    return geo;
}
    
function flipYZ(){
    pv.params.isFlipYZ = !pv.params.isFlipYZ;
    
    if(pv.params.isFlipYZ){
        referenceFrame.matrix.copy(new THREE.Matrix4());
        referenceFrame.applyMatrix(new THREE.Matrix4().set(
            1,0,0,0,
            0,0,1,0,
            0,-1,0,0,
            0,0,0,1
        ));
        
    }else{
        referenceFrame.matrix.copy(new THREE.Matrix4());
        referenceFrame.applyMatrix(new THREE.Matrix4().set(
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ));
    }
    
    referenceFrame.updateMatrixWorld(true);
    pointcloud.updateMatrixWorld();
    var sg = pointcloud.boundingSphere.clone().applyMatrix4(pointcloud.matrixWorld);
    referenceFrame.position.copy(sg.center).multiplyScalar(-1);
    referenceFrame.updateMatrixWorld(true);
    referenceFrame.position.y -= pointcloud.getWorldPosition().y;
    referenceFrame.updateMatrixWorld(true);
}

function onKeyDown(event){
   
    if(event.keyCode === 69){
        // e pressed
        
        transformationTool.translate();
    }else if(event.keyCode === 82){
        // r pressed
        
        transformationTool.scale();
    }else if(event.keyCode === 84){
        // r pressed
        
        transformationTool.rotate();
    }
}

pv.update = function (){
    if(pointcloud){
    
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);

        pointcloud.material.clipMode = pv.params.clipMode;
        pointcloud.material.heightMin = bbWorld.min.y;
        pointcloud.material.heightMax = bbWorld.max.y;
        pointcloud.material.intensityMin = 0;
        pointcloud.material.intensityMax = 200;
        pointcloud.showBoundingBox = pv.params.showBoundingBox;
        pointcloud.update(camera, renderer);
        updateMapFrustum();
        updateCoordinatePicking();
        pv.updateMapExtent();
    }
    
    if(stats && pv.params.stats){
        document.getElementById("lblNumVisibleNodes").style.display = "";
        document.getElementById("lblNumVisiblePoints").style.display = "";
        stats.domElement.style.display = "";
    
        stats.update();
    
        if(pointcloud){
            document.getElementById("lblNumVisibleNodes").innerHTML = "visible nodes: " + pointcloud.numVisibleNodes;
            document.getElementById("lblNumVisiblePoints").innerHTML = "visible points: " + Potree.utils.addCommas(pointcloud.numVisiblePoints);
        }
    }else if(stats){
        document.getElementById("lblNumVisibleNodes").style.display = "none";
        document.getElementById("lblNumVisiblePoints").style.display = "none";
        stats.domElement.style.display = "none";
    }
    
    controls.update(clock.getDelta());

    // update progress bar
    if(pointcloud){
        var progress = pointcloud.visibleNodes.length / pointcloud.visibleGeometry.length;
        
        progressBar.progress = progress;
        progressBar.message = "loading: " + pointcloud.visibleNodes.length + " / " + pointcloud.visibleGeometry.length;
        
        if(progress === 1){
            progressBar.hide();
        }else if(progress < 1){
            progressBar.show();
        }
    }else{
        progressBar.show();
        progressBar.message = "loading metadata";
    }
    
    volumeTool.update();
    transformationTool.update();
    profileTool.update();
    
    
    var clipBoxes = [];
    
    //var profiles = [];
    //for(var i = 0; i < profileTool.profiles.length; i++){
    //	profiles.push(profileTool.profiles[i]);
    //}
    //if(profileTool.activeProfile){
    //	profiles.push(profileTool.activeProfile);
    //}
    for(var i = 0; i < profileTool.profiles.length; i++){
        var profile = profileTool.profiles[i];
        
        for(var j = 0; j < profile.boxes.length; j++){
            var box = profile.boxes[j];
            box.updateMatrixWorld();
            var boxInverse = new THREE.Matrix4().getInverse(box.matrixWorld);
            clipBoxes.push(boxInverse);
        }
    }

    for(var i = 0; i < volumeTool.volumes.length; i++){
        var volume = volumeTool.volumes[i];
        
        if(volume.clip){
            volume.updateMatrixWorld();
            var boxInverse = new THREE.Matrix4().getInverse(volume.matrixWorld);
        
            clipBoxes.push(boxInverse);
        }
    }
    
    if(pointcloud){
        pointcloud.material.setClipBoxes(clipBoxes);
    }
    
};

function useFPSControls(){
    if(controls){
        controls.enabled = false;
    }
    if(!fpControls){
        fpControls = new THREE.FirstPersonControls(camera, renderer.domElement);
    }

    controls = fpControls;
    controls.enabled = true;
    
    controls.moveSpeed = pointcloud.boundingSphere.radius / 2;
}

function useOrbitControls(){
    if(controls){
        controls.enabled = false;
    }
    if(!orbitControls){
        orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    }
    
    controls = orbitControls;
    controls.enabled = true;
    
    if(pointcloud){
        controls.target.copy(pointcloud.boundingSphere.center.clone().applyMatrix4(pointcloud.matrixWorld));
    }
}

function getMousePointCloudIntersection(){
    var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
    vector.unproject(camera);
    var direction = vector.sub(camera.position).normalize();
    var ray = new THREE.Ray(camera.position, direction);
    
    var pointClouds = [];
    scene.traverse(function(object){
        if(object instanceof Potree.PointCloudOctree){
            pointClouds.push(object);
        }
    });
    
    var closestPoint = null;
    var closestPointDistance = null;
    for(var i = 0; i < pointClouds.length; i++){
        var pointcloud = pointClouds[i];
        var point = pointcloud.pick(renderer, camera, ray, {accuracy: 0.5});
        
        if(!point){
            continue;
        }
        
        var distance = camera.position.distanceTo(point.position);
        
        if(!closestPoint || distance < closestPointDistance){
            closestPoint = point;
            closestPointDistance = distance;
        }
    }
    
    return closestPoint ? closestPoint.position : null;
}

function onMouseMove(event){
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
}

/**
 * update the coordinate display if the "coordinates" checkbox is checked
 */
function updateCoordinatePicking(){
    if(pv.params.showCoordinates){
        // TODO: Fix this getMousePointCloudIntersection function
        var I = getMousePointCloudIntersection();
        if(I){
            var sceneCoordinates = I;
            var geoCoordinates = pv.toGeo(sceneCoordinates);
            
            var msg = "EPSG:21781: " + geoCoordinates.x.toFixed(2) + " / ";
            msg += geoCoordinates.y.toFixed(2) + " / ";
            msg += geoCoordinates.z.toFixed(2);
            msg += "  -  sceneCoordinates: " + sceneCoordinates.x.toFixed(2) + " / ";
            msg += sceneCoordinates.y.toFixed(2) + " / ";

            elCoordinates.innerHTML = msg;
        }
    }else{
        elCoordinates.innerHTML = "";
    }
}

function updateProgressBar(){
    if(pointcloud){
        var progress = pointcloud.visibleNodes.length / pointcloud.visibleGeometry.length;
        
        progressBar.progress = progress;
        progressBar.message = "loading: " + pointcloud.visibleNodes.length + " / " + pointcloud.visibleGeometry.length;
        
        if(progress === 1){
            progressBar.hide();
        }else if(progress < 1){
            progressBar.show();
        }
    }else{
        progressBar.show();
        progressBar.message = "loading metadata";
    }
}



pv.render = function(){
    // resize
    var width = elRenderArea.clientWidth;
    var height = elRenderArea.clientHeight;
    var aspect = width / height;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    

    // render skybox
    if(pv.params.showSkybox){
        skybox.camera.rotation.copy(camera.rotation);
        renderer.render(skybox.scene, skybox.camera);
    }else{
        renderer.render(sceneBG, cameraBG);
    }
    
    if(pointcloud){
        if(pointcloud.originalMaterial){
            pointcloud.material = pointcloud.originalMaterial;
        }
        
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);
        
        pointcloud.material.size = pv.params.pointSize;
        pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pointcloud.material.opacity = pv.params.opacity;
        pointcloud.material.pointColorType = pv.params.pointColorType;
        pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pointcloud.material.pointShape = (pv.params.quality === "Circles") ? Potree.PointShape.CIRCLE : Potree.PointShape.SQUARE;
        pointcloud.material.interpolate = (pv.params.quality  === "Interpolation");
        pointcloud.material.weighted = false;
    }
    
    // render scene
    renderer.render(scene, camera);
    renderer.render(scenePointCloud, camera);
    
    profileTool.render();
    volumeTool.render();
    
    renderer.clearDepth();
    measuringTool.render();
    areaTool.render();
    transformationTool.render();
};

// high quality rendering using splats
// 
var rtDepth = new THREE.WebGLRenderTarget( 1024, 1024, { 
    minFilter: THREE.NearestFilter, 
    magFilter: THREE.NearestFilter, 
    format: THREE.RGBAFormat, 
    type: THREE.FloatType
} );
var rtNormalize = new THREE.WebGLRenderTarget( 1024, 1024, { 
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.NearestFilter, 
    format: THREE.RGBAFormat, 
    type: THREE.FloatType
} );

var sceneNormalize;

var depthMaterial, weightedMaterial;

// render with splats
function renderHighQuality(){

    if(!sceneNormalize){
        sceneNormalize = new THREE.Scene();
                        
        var vsNormalize = document.getElementById('vs').innerHTML;
        var fsNormalize = document.getElementById('fs').innerHTML;
        
        var uniformsNormalize = {
            depthMap: { type: "t", value: rtDepth },
            texture: { type: "t", value: rtNormalize }
        };
        
        var materialNormalize = new THREE.ShaderMaterial({
            uniforms: uniformsNormalize,
            vertexShader: vsNormalize,
            fragmentShader: fsNormalize
        });
        
        var quad = new THREE.Mesh( new THREE.PlaneBufferGeometry(2, 2, 0), materialNormalize);
        quad.material.depthTest = true;
        quad.material.depthWrite = true;
        quad.material.transparent = true;
        sceneNormalize.add(quad);
    }
    // resize
    var width = elRenderArea.clientWidth;
    var height = elRenderArea.clientHeight;
    var aspect = width / height;
    
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    rtDepth.setSize(width, height);
    rtNormalize.setSize(width, height);
    

    renderer.clear();
    //renderer.render(sceneBG, cameraBG);
    // render skybox
    if(pv.params.showSkybox){
        skybox.camera.rotation.copy(camera.rotation);
        renderer.render(skybox.scene, skybox.camera);
    }else{
        renderer.render(sceneBG, cameraBG);
    }
    renderer.render(scene, camera);
    
    if(pointcloud){
        if(!weightedMaterial){
            pointcloud.originalMaterial = pointcloud.material;
            depthMaterial = new Potree.PointCloudMaterial();
            weightedMaterial = new Potree.PointCloudMaterial();
        }
        
        pointcloud.material = depthMaterial;
        
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pointcloud.boundingBox, pointcloud.matrixWorld);
        
        // get rid of this
        pointcloud.material.size = pv.params.pointSize;
        pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pointcloud.material.opacity = pv.params.opacity;
        pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pointcloud.material.pointColorType = Potree.PointColorType.DEPTH;
        pointcloud.material.pointShape = Potree.PointShape.CIRCLE;
        pointcloud.material.interpolate = (pv.params.quality  === "Interpolate");
        pointcloud.material.weighted = false;
        
        pointcloud.material.minSize = 2;
        pointcloud.material.screenWidth = width;
        pointcloud.material.screenHeight = height;
    
        pointcloud.update(camera, renderer);
        
        renderer.clearTarget( rtDepth, true, true, true );
        renderer.clearTarget( rtNormalize, true, true, true );
        
        var origType = pointcloud.material.pointColorType;
        renderer.render(scenePointCloud, camera, rtDepth);
        
        pointcloud.material = weightedMaterial;
        
        
        
        // get rid of this
        pointcloud.material.size = pv.params.pointSize;
        pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pointcloud.material.opacity = pv.params.opacity;
        pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pointcloud.material.pointColorType = pv.params.pointColorType;
        pointcloud.material.pointShape = Potree.PointShape.CIRCLE;
        pointcloud.material.interpolate = (pv.params.quality  === "Interpolation");
        pointcloud.material.weighted = true;
        
        pointcloud.material.depthMap = rtDepth;
        pointcloud.material.blendDepth = Math.min(pointcloud.material.spacing, 20);
        pointcloud.update(camera, renderer);
        renderer.render(scenePointCloud, camera, rtNormalize);
        
    
        volumeTool.render();
        profileTool.render();
        renderer.render(sceneNormalize, cameraBG);
        
        
        renderer.clearDepth();
        measuringTool.render();
        areaTool.render();
        transformationTool.render();
            
    }


}

pv.loop = function () {
    requestAnimationFrame(pv.loop);
    
    pv.update();
    
    if(pv.params.quality  === "Splats"){
        renderHighQuality();
    }else{
        pv.render();
    }
    
};