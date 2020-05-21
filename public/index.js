import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

//https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

let TEXT = ["POOPY", "DIAPER"]

let letters_needed = new Set()

for (let i = 0; i < 1; i++) {
  let first_str = TEXT[i];
  let following_str = TEXT[(i+1)%TEXT.length];
  for (let j = 0; j < Math.max(first_str.length, following_str.length); j++) {
    let front_char = first_str[Math.min(j, first_str.length - 1)];
    let right_char = following_str[((following_str.length - 1) - j) % following_str.length];
    letters_needed.add(front_char+right_char);
  }
}

let items_processed = 0;
let loader = new GLTFLoader();
let letter_objects = {};

letters_needed.forEach((letter) => {
  loader.load('assets/'+ letter + '.glb', (gltf) => {
    letter_objects[letter] = gltf.scene.children[0].geometry;
    if (++items_processed == letters_needed.size) {
      main();
    }
  }, () => {}, (error) => {console.log(error)});
});
function main() {
  console.log(letter_objects);
  let renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 1);

  document.getElementById('canvas').appendChild(renderer.domElement);

  window.addEventListener('resize', function() {
    this.setSize(window.innerWidth, window.innerHeight, false);
  }.bind(renderer))

  //let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  let width = height = TEXT[0].length+1;
  let height = 2;
  let camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, .01, 1000 );
  camera.up.set(0, 0, -1);
  camera.lookAt(0,0,0);
  
  let scene = new THREE.Scene();

  let first_str = TEXT[0];
  let following_str = TEXT[1];
  for (let j = 0; j < Math.max(first_str.length, following_str.length); j++) {
    let front_char = first_str[Math.min(j, first_str.length - 1)];
    let right_char = following_str[((following_str.length - 1) - j) % following_str.length];
    console.log(front_char + right_char);
    let geo = letter_objects[front_char + right_char];
    let obj = new THREE.Mesh(geo, new THREE.MeshNormalMaterial({side:THREE.DoubleSide}));
    obj.position.x = Math.min(j, first_str.length - 1) - width/2;
    obj.position.y = j - width/2;

    let helper = new THREE.BoxHelper(obj, 0x0000ff);
    scene.add(helper);

    scene.add(obj);

  }

  //BACKGROUND
  for (let i = 0; i < 50; i++) {
    let geo = new THREE.SphereGeometry(1, 10, 10);
    let obj = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: 0xffffff, side:THREE.DoubleSide}));
    obj.position.x = Math.random() * 10 - 5;
    obj.position.z = Math.random() * 10 - 5;
    obj.position.y = Math.random() * 10 - 5;
    obj.scale.set(.1,.1,.1);
    scene.add(obj);
  }


  let theta = 0;
  let sign = 1;
  function animate() {
    camera.position.x = 10*Math.sin(theta);
    camera.position.y = 10*Math.cos(theta);
    theta = (theta + sign*.01);
    if (theta > Math.PI/2) {
      sign = -1;
    } else if (theta < 0) {
      sign = 1;
    }
    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
    setTimeout(() => requestAnimationFrame(animate), 1000/30);
  }
  animate();
}
