import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

let TEXT = ["FIRST", "IMPRESSIONS", "CAN", "DECIEVE"];

let letters_needed = new Set()
let letter_positions = Array(TEXT.length);

for (let i = 0; i < TEXT.length; i++) {
  letter_positions[i] = [];
  let first_str = TEXT[i];
  let following_str = TEXT[(i+1)%TEXT.length];
  following_str = following_str.split("").reverse().join("");
  let long_string = first_str.length > following_str.length ? first_str : following_str;
  let short_string = first_str.length > following_str.length ? following_str : first_str;
  let indicies = [...Array(long_string.length).keys()];
  shuffle(indicies);

  for (let j = 0; j < short_string.length; j++) {
    indicies[j] = [indicies[j]];
  }
  for (let j = long_string.length - 1; j >= short_string.length; j--) {
    let merge_index = Math.floor(Math.random() * short_string.length);
    indicies[merge_index].push(indicies[j]);
    indicies.splice(j, 1);
  }
  for(let j = 0; j < short_string.length; j++) {
    for (let k = 0; k < indicies[j].length; k++) {
      let first_ind = j;
      let following_ind = indicies[j][k];
      if (first_str.length > following_str.length) {
        first_ind = following_ind;
        following_ind = j;
      }
      let letter = first_str[first_ind]+following_str[following_ind];
      letters_needed.add(letter);
      letter_positions[i].push([letter, first_ind, following_ind]);
    }
  }
  console.log(indicies);
}
console.log(letter_positions);
console.log(letters_needed);

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
  let width = Math.max(...TEXT.map(t=>t.length)) + 1;
  let height = 2;
  let camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, .01, 1000 );
  camera.up.set(0, 0, -1);
  camera.lookAt(0,0,0);
  
  let scene = new THREE.Scene();
  
  let axesHelper = new THREE.AxesHelper( 5 );
  scene.add( axesHelper );

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

  let last_scene_objects = [];
  function update_scene(t, quad) {
    scene.remove(...last_scene_objects);
    last_scene_objects = [];
    let first_str = TEXT[t % TEXT.length];
    let following_str = TEXT[(t+1) % TEXT.length];
    for (let i = 0; i < letter_positions[t].length; i++) {
      let geo = letter_objects[letter_positions[t][i][0]];
      let obj = new THREE.Mesh(geo, new THREE.MeshNormalMaterial({side:THREE.DoubleSide}));
      obj.rotateOnAxis(new THREE.Vector3(0, 0, 1), quad*Math.PI/2);
      if (quad == 0) {
        obj.position.x = letter_positions[t][i][1] - width/2;
        obj.position.y = letter_positions[t][i][2] - width/2;
      } else if (quad == 1) {
        obj.position.y = (letter_positions[t][i][1] + 1) - width/2;
        obj.position.x = letter_positions[t][i][2] - width/2;
      } else if (quad == 2) {
        obj.position.x = (TEXT[t].length - letter_positions[t][i][1] - 1) - width/2;
        obj.position.y = (TEXT[(t + 1)%TEXT.length].length - letter_positions[t][i][2] - 1) - width/2;
      } else if (quad == 3) {
        obj.position.y = letter_positions[t][i][1] - width/2;
        obj.position.x = (TEXT[(t + 1)%TEXT.length].length - letter_positions[t][i][2] - 1) - width/2;
      }
      scene.add(obj);
      last_scene_objects.push(obj);
    }
  }
  update_scene(0, 0);
  let t = 0;
  let epsilon = .003;
  let theta = 0;
  let sign = 1;
  let radius = width*5;
  let last_time = 0;
  let pause = false;
  let pause_time = 0;
  let pause_duration = 1000;
  let update_next = -1;
  function animate(time) {
    let seconds_past = (time-last_time)/1000;
    camera.position.x = radius*Math.sin(theta);
    camera.position.y = radius*Math.cos(theta);
    let abs_epsilon = Math.abs(epsilon);
    if (update_next == -1) {
      theta = (theta + epsilon) % (2*Math.PI);
    } else {
      theta = update_next*Math.PI/2;
    }
    let quad = -1;
    if (update_next == -1 && theta <= 0 && theta + epsilon > 0) {
      quad = 0;
    } else if (update_next == -1 && theta <= Math.PI/2 && theta + epsilon > Math.PI/2) {
      quad = 1;
    } else if (update_next == -1 && theta <= Math.PI && theta + epsilon > Math.PI) {
      quad = 2;
    } else if (update_next == -1 && theta <= 3*Math.PI/2 && theta + epsilon > 3*Math.PI/2) {
      quad = 3;
    }
    if (update_next != -1) {
      theta = quad*Math.PI/2;
      t = (t + 1) % TEXT.length;
      update_scene(t, update_next);
      update_next = -1;
    }
    if (quad != -1) {
      update_next = quad;
    }
    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
    last_time = time;
    setTimeout(() => requestAnimationFrame(animate), 0);
  }
  camera.position.x = radius*Math.sin(theta);
  camera.position.y = radius*Math.cos(theta);
  camera.lookAt(0,0,0);
  renderer.render(scene, camera);
  setTimeout(() => animate(0), 1000);
}
