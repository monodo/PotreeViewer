/**
 * transform from geo coordinates to local pv.scene3D.scene coordinates
 */
/**
 * transform from local pv.scene3D.scene coordinates to local coordinates
 */
pv.utils.toLocal = function (position){
    var scenePos = position.clone().applyMatrix4(pv.scene3D.referenceFrame.matrixWorld);
    return scenePos;
}

/**
 * transform from local pv.scene3D.scene coordinates to geo coordinates
 */
pv.utils.toGeo = function(object){
    var geo;
    var inverse = new THREE.Matrix4().getInverse(pv.scene3D.referenceFrame.matrixWorld);

    if(object instanceof THREE.Vector3){	
        geo = object.clone().applyMatrix4(inverse);
    }else if(object instanceof THREE.Box3){
        var geoMin = object.min.clone().applyMatrix4(inverse);
        var geoMax = object.max.clone().applyMatrix4(inverse);
        geo = new THREE.Box3(geoMin, geoMax);
    }
    return geo;
}

/**
 * Flip YZ Coordinates
 */
pv.utils.flipYZ = function (){
    pv.params.isFlipYZ = !pv.params.isFlipYZ;

    if(pv.params.isFlipYZ){
        pv.scene3D.referenceFrame.matrix.copy(new THREE.Matrix4());
        pv.scene3D.referenceFrame.applyMatrix(new THREE.Matrix4().set(
            1,0,0,0,
            0,0,1,0,
            0,-1,0,0,
            0,0,0,1
        ));

    }else{
        pv.scene3D.referenceFrame.matrix.copy(new THREE.Matrix4());
        pv.scene3D.referenceFrame.applyMatrix(new THREE.Matrix4().set(
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ));
    }

    pv.scene3D.referenceFrame.updateMatrixWorld(true);
    pv.scene3D.pointcloud.updateMatrixWorld();
    var sg = pv.scene3D.pointcloud.boundingSphere.clone().applyMatrix4(pv.scene3D.pointcloud.matrixWorld);
    pv.scene3D.referenceFrame.position.copy(sg.center).multiplyScalar(-1);
    pv.scene3D.referenceFrame.updateMatrixWorld(true);
    pv.scene3D.referenceFrame.position.y -= pv.scene3D.pointcloud.getWorldPosition().y;
    pv.scene3D.referenceFrame.updateMatrixWorld(true);
}

pv.utils.onKeyDown = function (event){
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

pv.utils.update = function (){
    if(pv.scene3D.pointcloud){
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pv.scene3D.pointcloud.boundingBox, pv.scene3D.pointcloud.matrixWorld);

        pv.scene3D.pointcloud.material.clipMode = pv.params.clipMode;
        pv.scene3D.pointcloud.material.heightMin = bbWorld.min.y;
        pv.scene3D.pointcloud.material.heightMax = bbWorld.max.y;
        pv.scene3D.pointcloud.material.intensityMin = 0;
        pv.scene3D.pointcloud.material.intensityMax = 200;
        pv.scene3D.pointcloud.showBoundingBox = pv.params.showBoundingBox;
        pv.scene3D.pointcloud.update(pv.scene3D.camera, pv.scene3D.renderer);

        pv.map2D.updateMapFrustum();
        pv.utils.updateCoordinatePicking();
        pv.updateMapExtent();
    }
    
    if(stats && pv.params.stats){
        document.getElementById("lblNumVisibleNodes").style.display = "";
        document.getElementById("lblNumVisiblePoints").style.display = "";
        stats.domElement.style.display = "";
    
        stats.update();
    
        if(pv.scene3D.pointcloud){
            document.getElementById("lblNumVisibleNodes").innerHTML = "visible nodes: " + pv.scene3D.pointcloud.numVisibleNodes;
            document.getElementById("lblNumVisiblePoints").innerHTML = "visible points: " + Potree.utils.addCommas(pv.scene3D.pointcloud.numVisiblePoints);
        }
    }else if(stats){
        document.getElementById("lblNumVisibleNodes").style.display = "none";
        document.getElementById("lblNumVisiblePoints").style.display = "none";
        stats.domElement.style.display = "none";
    }
    
    pv.scene3D.controls.update(pv.scene3D.clock.getDelta());

    // update progress bar
    if(pv.scene3D.pointcloud){
        var progress = pv.scene3D.pointcloud.visibleNodes.length / pv.scene3D.pointcloud.visibleGeometry.length;
        
        progressBar.progress = progress;
        progressBar.message = "loading: " + pv.scene3D.pointcloud.visibleNodes.length + " / " + pv.scene3D.pointcloud.visibleGeometry.length;
        
        if(progress === 1){
            progressBar.hide();
        }else if(progress < 1){
            progressBar.show();
        }
    }else{
        progressBar.show();
        progressBar.message = "loading metadata";
    }
    
    pv.scene3D.volumeTool.update();
    transformationTool.update();
    pv.scene3D.profileTool.update();
    
    
    var clipBoxes = [];
    
    //var profiles = [];
    //for(var i = 0; i < profileTool.profiles.length; i++){
    //	profiles.push(profileTool.profiles[i]);
    //}
    //if(profileTool.activeProfile){
    //	profiles.push(profileTool.activeProfile);
    //}
    for(var i = 0; i < pv.scene3D.profileTool.profiles.length; i++){
        var profile = pv.scene3D.profileTool.profiles[i];
        
        for(var j = 0; j < profile.boxes.length; j++){
            var box = profile.boxes[j];
            box.updateMatrixWorld();
            var boxInverse = new THREE.Matrix4().getInverse(box.matrixWorld);
            clipBoxes.push(boxInverse);
        }
    }

    for(var i = 0; i < pv.scene3D.volumeTool.volumes.length; i++){
        var volume = pv.scene3D.volumeTool.volumes[i];
        
        if(volume.clip){
            volume.updateMatrixWorld();
            var boxInverse = new THREE.Matrix4().getInverse(volume.matrixWorld);
        
            clipBoxes.push(boxInverse);
        }
    }
    
    if(pv.scene3D.pointcloud){
        pv.scene3D.pointcloud.material.setClipBoxes(clipBoxes);
    }
    
};

pv.utils.useFPSControls = function (){
    if(pv.scene3D.controls){
        pv.scene3D.controls.enabled = false;
    }
    if(!pv.scene3D.fpControls){
        pv.scene3D.fpControls = new THREE.FirstPersonControls(pv.scene3D.camera, pv.scene3D.renderer.domElement);
    }

    pv.scene3D.controls = pv.scene3D.fpControls;
    pv.scene3D.controls.enabled = true;
    pv.scene3D.controls.moveSpeed = pv.scene3D.pointcloud.boundingSphere.radius / 2;
}

pv.utils.useOrbitControls = function (){
    if(pv.scene3D.controls){
        pv.scene3D.controls.enabled = false;
    }
    if(!pv.scene3D.orbitControls){
        pv.scene3D.orbitControls = new THREE.OrbitControls(pv.scene3D.camera, pv.scene3D.renderer.domElement);
    }
    
    pv.scene3D.controls = pv.scene3D.orbitControls;
    pv.scene3D.controls.enabled = true;
    
    if(pv.scene3D.pointcloud){
        pv.scene3D.controls.target.copy(pv.scene3D.pointcloud.boundingSphere.center.clone().applyMatrix4(pv.scene3D.pointcloud.matrixWorld));
    }
}

pv.utils.getMousePointCloudIntersection = function (){
    var vector = new THREE.Vector3( pv.scene3D.mouse.x, pv.scene3D.mouse.y, 0.5 );
    vector.unproject(pv.scene3D.camera);
    var direction = vector.sub(pv.scene3D.camera.position).normalize();
    var ray = new THREE.Ray(pv.scene3D.camera.position, direction);
    
    var pointClouds = [];
    pv.scene3D.scene.traverse(function(object){
        if(object instanceof Potree.PointCloudOctree){
            pointClouds.push(object);
        }
    });
    
    var closestPoint = null;
    var closestPointDistance = null;
    for(var i = 0; i < pointClouds.length; i++){
        var pointcloud = pointClouds[i];
        var point = pointcloud.pick(pv.scene3D.renderer, pv.scene3D.camera, ray, {accuracy: 0.5});
        
        if(!point){
            continue;
        }
        
        var distance = pv.scene3D.camera.position.distanceTo(point.position);
        
        if(!closestPoint || distance < closestPointDistance){
            closestPoint = point;
            closestPointDistance = distance;
        }
    }
    
    return closestPoint ? closestPoint.position : null;
}

pv.utils.onMouseMove = function (event){
    pv.scene3D.mouse.x = ( event.clientX / pv.scene3D.renderer.domElement.clientWidth ) * 2 - 1;
    pv.scene3D.mouse.y = - ( event.clientY / pv.scene3D.renderer.domElement.clientHeight ) * 2 + 1;
}

/**
 * update the coordinate display if the "coordinates" checkbox is checked
 */
pv.utils.updateCoordinatePicking = function (){
    if(pv.params.showCoordinates){
        // TODO: Fix this getMousePointCloudIntersection function
        var I = pv.utils.getMousePointCloudIntersection();
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

pv.utils.updateProgressBar = function (){
    if(pv.scene3D.pointcloud){
        var progress = pv.scene3D.pointcloud.visibleNodes.length / pv.scene3D.pointcloud.visibleGeometry.length;
        
        progressBar.progress = progress;
        progressBar.message = "loading: " + pv.scene3D.pointcloud.visibleNodes.length + " / " + pv.scene3D.pointcloud.visibleGeometry.length;
        
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

pv.scene3D.render = function(){
    // resize
    var width = elRenderArea.clientWidth;
    var height = elRenderArea.clientHeight;
    var aspect = width / height;
    
    pv.scene3D.camera.aspect = aspect;
    pv.scene3D.camera.updateProjectionMatrix();
    
    pv.scene3D.renderer.setSize(width, height);
    

    // render pv.scene3D.skybox
    if(pv.params.showSkybox){
        pv.scene3D.skybox.rotation.copy(pv.scene3D.camera.rotation);
        pv.scene3D.renderer.render(pv.scene3D.skybox.pv.scene3D.scene, pv.scene3D.skybox.pv.scene3D.camera);
    }else{
        pv.scene3D.renderer.render(pv.scene3D.sceneBG, pv.scene3D.cameraBG);
    }
    
    if(pv.scene3D.pointcloud){
        if(pv.scene3D.pointcloud.originalMaterial){
            pv.scene3D.pointcloud.material = pv.scene3D.pointcloud.originalMaterial;
        }
        
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pv.scene3D.pointcloud.boundingBox, pv.scene3D.pointcloud.matrixWorld);
        
        pv.scene3D.pointcloud.material.size = pv.params.pointSize;
        pv.scene3D.pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pv.scene3D.pointcloud.material.opacity = pv.params.opacity;
        pv.scene3D.pointcloud.material.pointColorType = pv.params.pointColorType;
        pv.scene3D.pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pv.scene3D.pointcloud.material.pointShape = (pv.params.quality === "Circles") ? Potree.PointShape.CIRCLE : Potree.PointShape.SQUARE;
        pv.scene3D.pointcloud.material.interpolate = (pv.params.quality  === "Interpolation");
        pv.scene3D.pointcloud.material.weighted = false;
    }
    
    // render pv.scene3D.scene
    pv.scene3D.renderer.render(pv.scene3D.scene, pv.scene3D.camera);
    pv.scene3D.renderer.render(pv.scene3D.scenePointCloud, pv.scene3D.camera);
    
    pv.scene3D.profileTool.render();
    pv.scene3D.volumeTool.render();
    
    pv.scene3D.renderer.clearDepth();
    pv.scene3D.measuringTool.render();
    pv.scene3D.areaTool.render();
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
        sceneNormalize = new THREE.pv.scene3D.scene();
                        
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
    
    pv.scene3D.camera.aspect = aspect;
    pv.scene3D.camera.updateProjectionMatrix();

    pv.scene3D.renderer.setSize(width, height);
    rtDepth.setSize(width, height);
    rtNormalize.setSize(width, height);

    pv.scene3D.renderer.clear();
    // render pv.scene3D.skybox
    if(pv.params.showSkybox){
        pv.scene3D.skybox.pv.scene3D.camera.rotation.copy(pv.scene3D.camera.rotation);
        pv.scene3D.renderer.render(pv.scene3D.skybox.pv.scene3D.scene, pv.scene3D.skybox.pv.scene3D.camera);
    }else{
        pv.scene3D.renderer.render(pv.scene3D.sceneBG, pv.scene3D.cameraBG);
    }
    pv.scene3D.renderer.render(pv.scene3D.scene, pv.scene3D.camera);

    if(pv.scene3D.pointcloud){
        if(!weightedMaterial){
            pv.scene3D.pointcloud.originalMaterial = pv.scene3D.pointcloud.material;
            depthMaterial = new Potree.PointCloudMaterial();
            weightedMaterial = new Potree.PointCloudMaterial();
        }

        pv.scene3D.pointcloud.material = depthMaterial;
        
        var bbWorld = Potree.utils.computeTransformedBoundingBox(pv.scene3D.pointcloud.boundingBox, pv.scene3D.pointcloud.matrixWorld);
        
        // get rid of this
        pv.scene3D.pointcloud.material.size = pv.params.pointSize;
        pv.scene3D.pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pv.scene3D.pointcloud.material.opacity = pv.params.opacity;
        pv.scene3D.pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pv.scene3D.pointcloud.material.pointColorType = Potree.PointColorType.DEPTH;
        pv.scene3D.pointcloud.material.pointShape = Potree.PointShape.CIRCLE;
        pv.scene3D.pointcloud.material.interpolate = (pv.params.quality  === "Interpolate");
        pv.scene3D.pointcloud.material.weighted = false;
        pv.scene3D.pointcloud.material.minSize = 2;
        pv.scene3D.pointcloud.material.screenWidth = width;
        pv.scene3D.pointcloud.material.screenHeight = height;
        pv.scene3D.pointcloud.update(pv.scene3D.camera, pv.scene3D.renderer);
        pv.scene3D.renderer.clearTarget( rtDepth, true, true, true );
        pv.scene3D.renderer.clearTarget( rtNormalize, true, true, true );
        
        var origType = pv.scene3D.pointcloud.material.pointColorType;
        pv.scene3D.renderer.render(pv.scene3D.scenePointCloud, pv.scene3D.camera, rtDepth);
        pv.scene3D.pointcloud.material = weightedMaterial;

        // get rid of this
        pv.scene3D.pointcloud.material.size = pv.params.pointSize;
        pv.scene3D.pointcloud.visiblePointsTarget = pv.params.pointCountTarget * 1000 * 1000;
        pv.scene3D.pointcloud.material.opacity = pv.params.opacity;
        pv.scene3D.pointcloud.material.pointSizeType = pv.params.pointSizeType;
        pv.scene3D.pointcloud.material.pointColorType = pv.params.pointColorType;
        pv.scene3D.pointcloud.material.pointShape = Potree.PointShape.CIRCLE;
        pv.scene3D.pointcloud.material.interpolate = (pv.params.quality  === "Interpolation");
        pv.scene3D.pointcloud.material.weighted = true;
        
        pv.scene3D.pointcloud.material.depthMap = rtDepth;
        pv.scene3D.pointcloud.material.blendDepth = Math.min(pv.scene3D.pointcloud.material.spacing, 20);
        pv.scene3D.pointcloud.update(pv.scene3D.camera, pv.scene3D.renderer);
        pv.scene3D.renderer.render(pv.scene3D.scenePointCloud, pv.scene3D.camera, rtNormalize);

        volumeTool.render();
        profileTool.render();
        pv.scene3D.renderer.render(sceneNormalize, pv.scene3D.cameraBG);

        pv.scene3D.renderer.clearDepth();
        measuringTool.render();
        areaTool.render();
        pv.scene3D.transformationTool.render();
            
    }


}

pv.utils.loop = function () {
    requestAnimationFrame(pv.utils.loop);
    
    pv.utils.update();
    
    if(pv.params.quality  === "Splats"){
        renderHighQuality();
    }else{
        pv.scene3D.render();
    }
    
};