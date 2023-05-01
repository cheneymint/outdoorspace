import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {FBXLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import {Points} from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {ShaderMaterial} from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

class FireParticleSystem {
  constructor() {
    this._fireParticleSystem = this._CreateFireParticleSystem();
  }

  _CreateFireParticleSystem() {
    const fireGeo = new THREE.BufferGeometry();
    const fireCount = 500;
    const fireVertices = [];
    const fireSizes = new Float32Array(fireCount);

  
  for (let i = 0; i < fireCount; i++) {
    fireVertices.push(Math.random() * 20 - 10);
    fireVertices.push(Math.random() * 20 - 10);
    fireVertices.push(Math.random() * 20 - 10);
    fireSizes[i] = 2 + Math.random() * 5;
  }

  fireGeo.setAttribute('position', new THREE.Float32BufferAttribute(fireVertices, 3));
  fireGeo.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));

  const fireMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: {value: 1.0},
      size: {value: 5.0},
      texture: {value: new THREE.TextureLoader().load("./resources/fire.png")},
    },
    vertexShader: this._FireParticleVertexShader(),
    fragmentShader: this._FireParticleFragmentShader(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const fireParticleSystem = new THREE.Points(fireGeo, fireMaterial);
  fireParticleSystem.position.set(0, 5, 0);
  this._scene.add(fireParticleSystem);
  return fireParticleSystem;
}

_FireParticleVertexShader() {
  return `
    uniform float time;
    attribute float size;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
}

_FireParticleFragmentShader() {
  return `
    uniform sampler2D texture;
    varying vec2 vUv;

    void main() {
      vec4 texColor = texture2D(texture, vUv);
      gl_FragColor = vec4(texColor.rgb, texColor.a);
    }
  `;
}
update(timeElapsedS) {
  if (this._fireParticleSystem) {
    this._fireParticleSystem.material.uniforms.time.value += timeElapsedS;
  }
}

get particleSystem() {
  return this._fireParticleSystem;
}
}
class BasicCharacterControls {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._move = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._move.forward = true;
        break;
      case 65: // a
        this._move.left = true;
        break;
      case 83: // s
        this._move.backward = true;
        break;
      case 68: // d
        this._move.right = true;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  _onKeyUp(event) {
    switch(event.keyCode) {
      case 87: // w
        this._move.forward = false;
        break;
      case 65: // a
        this._move.left = false;
        break;
      case 83: // s
        this._move.backward = false;
        break;
      case 68: // d
        this._move.right = false;
        break;
      case 38: // up
      case 37: // left
      case 40: // down
      case 39: // right
        break;
    }
  }

  Update(timeInSeconds) {
    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
        velocity.x * this._decceleration.x,
        velocity.y * this._decceleration.y,
        velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
        Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._params.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    if (this._move.forward) {
      velocity.z += this._acceleration.z * timeInSeconds;
    }
    if (this._move.backward) {
      velocity.z -= this._acceleration.z * timeInSeconds;
    }
    if (this._move.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._move.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);
  }
}


class LoadModelDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, 0);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0xFFFFFF, 4.0);
    this._scene.add(light);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x202020,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    this._mixers = [];
    this._previousRAF = null;

    this._LoadAnimatedModel();
    
    _Initialize() ;
      // ... other initializations ...
    
      this._LoadAnimatedModel((fbx) => {
        this._fireParticleSystem = this._CreateFireParticleSystem();
        if (this._fireParticleSystem) {
          // Set the position of the fire particle system relative to the model.
          this._fireParticleSystem.position.set(0, 5, 0);
          // Attach the fire particle system to the animated model.
          fbx.add(this._fireParticleSystem);
        }
      });
      
      // ... other initializations ...
    
      this._RAF();
    }
    

  

  
    
      _LoadAnimatedModel(callback) {
        const loader = new FBXLoader();
        loader.setPath('./resources/zombie/');
        loader.load('mremireh_o_desbiens.fbx', (fbx) => {
          fbx.scale.setScalar(0.1);
          fbx.traverse(c => {
            c.castShadow = true;
          });
    
          // Set the zombie instance to the loaded model
          this._zombie = fbx;
    
          const params = {
            target: fbx,
            camera: this._camera,
          }
          this._controls = new BasicCharacterControls(params);
    
          const anim = new FBXLoader();
          anim.setPath('./resources/zombie/');
          anim.load('walk.fbx', (anim) => {
            const m = new THREE.AnimationMixer(fbx);
            this._mixers.push(m);
            const idle = m.clipAction(anim.animations[0]);
            idle.play();
          });
          this._scene.add(fbx);
          if (callback) callback(fbx);
        });
      }
    
      // ... other methods ...
    
      _Step(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        if (this._mixers) {
          this._mixers.map(m => m.update(timeElapsedS));
        }
    
        if (this._controls) {
          this._controls.Update(timeElapsedS);
        }
    
        if (this._fireParticleSystem) {
          this._fireParticleSystem.material.uniforms.time.value += timeElapsedS;
        }
    
        // Update the chat window position based on the zombie's head
        if (this._zombie) {
          this.updateChatWindowPosition();
        }
      }
    
      updateChatWindowPosition() {
        // Get the chat window element
        const chatWindow = document.getElementById("chat-window");
    
        // Get the zombie's head position
        const zombieHeadPosition = this.getHeadPosition();
    
        // Set the chat window's position
        chatWindow.style.left = `${zombieHeadPosition.x}px`;
        chatWindow.style.top = `${zombieHeadPosition.y}px`;
      }
    
      getHeadPosition() {
        // Replace this with the actual calculation for the head's position
        const headPosition = {
          x: this._zombie.position.x,
          y: this._zombie.position.y,
        };
    
        return headPosition;
      }
    }
    
    let _APP = null;
    
    window.addEventListener('DOMContentLoaded', () => {
      _APP = new LoadModelDemo();
    });
    