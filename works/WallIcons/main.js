import * as THREE from '../../libs/three.js-r132/build/three.module.js';
import { ARButton } from '../../libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { loadGLTF } from "../../libs/loader.js";

document.addEventListener('DOMContentLoaded', () => {
  const initialize = async() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);

    const reticleGeometry = new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX(- Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    const arButton = ARButton.createButton(renderer, {requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: {root: document.body}});
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);

    const controller = renderer.xr.getController(0);
    scene.add(controller);
    controller.addEventListener('select', async () => {
      console.log('mesh.position 1:', new THREE.Vector3().setFromMatrixPosition(reticle.matrix).y);
      if (Math.abs(Math.floor(new THREE.Vector3().setFromMatrixPosition(reticle.matrix).y)) > 1) return;
      const geometry = new THREE.BoxGeometry(0.06, 0.06, 0.06);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random()});
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.setFromMatrixPosition(reticle.matrix);
      // console.log('mesh.position',mesh.position, new THREE.Vector3().setFromMatrixPosition(reticle.matrix));
      // mesh.scale.y = Math.random() * 2 + 1;
      // scene.add(mesh);

      const gltf = await loadGLTF('./Dog_Icon.glb');
      gltf.scene.scale.set(0.05, 0.05, 0.05);
      gltf.scene.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
      // gltf.scene.rotation.set(0, -1.25, 0);
      // gltf.scene.rotation.set(0, 0, 0);
      gltf.scene.rotation.set(0, (Math.abs(new THREE.Vector3().setFromMatrixPosition(reticle.matrix).x) * -1 + 0.5) * -1, 0);
      scene.add(gltf.scene);
    });

    renderer.xr.addEventListener("sessionstart", async (e) => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({space: viewerReferenceSpace});

      renderer.setAnimationLoop((timestamp, frame) => {
        if (!frame) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length) {
          console.log('mesh.position 0:', new THREE.Vector3().setFromMatrixPosition(reticle.matrix).x);
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace(); // ARButton requested 'local' reference space
          const hitPose = hit.getPose(referenceSpace);

          reticle.visible = true;
          reticle.matrix.fromArray(hitPose.transform.matrix);
        } else {
          reticle.visible = false;
        }

        renderer.render(scene, camera);
      });
    });

    renderer.xr.addEventListener("sessionend", () => {
      console.log("session end");
    });

  }

  initialize();
});
