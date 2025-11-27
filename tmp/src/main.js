import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {Mesh, MeshBasicMaterial, Object3D, Timer} from "three";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0xffffff, 1 );
document.body.appendChild( renderer.domElement );
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;


// BUILD THE SCENE
const light = new THREE.AmbientLight( 0xffffff,1 );
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set(0,0,1);
directionalLight.target.position.set(0,0,0);
scene.add( directionalLight );


// LOAD MESHES
const loader = new GLTFLoader();
function loadMesh(url,color){
    return new Promise ((resolve, reject) => {
        loader.load(url, data=> resolve(data), null, reject);
    }).then(data => {

        let mat = new THREE.MeshStandardMaterial();
        mat.color.setRGB(color[0], color[1], color[2]);
        mat.emissiveIntensity = 0.5;
        mat.emissiveColor = color;
        mat.roughness = 0.3;
        mat.metalness = 0.1;

        data.scene.traverse((o) => {
            if (o.isMesh) o.material = mat;
        });

        return [data.scene,mat]
    })
}


const A = await loadMesh('/assets/polymorphs/combined.glb',[0,0,0])
const B = await loadMesh('/assets/polymorphs/joint.glb',[0.5,0,1])






class Joint{
    constructor(){
        this.origin = new Object3D()
        this.joint = new Object3D()
        this.origin.add(this.joint)
    }
    Add(joint){
        this.joint.add(joint.origin)
    }
    Remove(){
        this.origin.removeFromParent()
        this.joint.removeFromParent()
    }
}

// blue: 0.012,0.66,0.95
// green: 0.476,0.679,0.238
// orange: 0.96470588, 0.59215686, 0.12156863

class Link{
    constructor(mesh,material,index,tag){
        this.origin = new Object3D()
        this.link = mesh.clone()
        this.origin.add(this.link)

        this.link.traverse((o) => {
            if (o.isMesh) {
                o.userData.tag = tag
                o.userData.resetMaterial = material.clone();
                o.userData.highlightMaterial = material.clone();
                o.userData.highlightMaterial.color.setRGB(0.96470588, 0.59215686, 0.12156863)
                o.userData.lowlightMaterial = material.clone();
                o.userData.lowlightMaterial.color.setRGB(0.012,0.66,0.95)
                o.userData.index = index
                o.material = o.userData.resetMaterial;
            }
        });
    }
    Remove() {
        this.origin.removeFromParent()
        this.link.removeFromParent()
    }
}

class Cell {
    constructor(index,port){

        this.port = port;

        let sep1 = 0.653
        let sep2 = 0.44
        let sep3 = 0.1075

        // make the links
        this.M = new Link(A[0],A[1],index,'M')
        this.L = new Link(B[0],B[1],index,'L')
        this.R = new Link(B[0],B[1],index,'R')

        this.jMA = new Joint()
        this.jMB = new Joint()
        this.jLA = new Joint()
        this.jRA = new Joint()
        this.jLB = new Joint()
        this.jRB = new Joint()

        switch (this.port){
            case(0):{

                this.jMB.Add(this.jMA)
                this.jMA.Add(this.jLA)
                this.jMA.Add(this.jRA)

                this.jLA.Add(this.jLB)
                this.jRA.Add(this.jRB)

                this.jMA.Add(this.M)
                this.jLA.Add(this.L)
                this.jRA.Add(this.R)

                //
                this.jMA.origin.position.z = 0.0

                this.jMB.origin.position.z = -sep3
                this.jMB.origin.rotation.x = Math.PI*0.5
                this.jMB.origin.rotation.z = -Math.PI*0.5

                this.jLA.origin.position.z = sep1
                this.jLA.origin.rotation.y = Math.PI
                this.jRA.origin.position.z = -sep1

                this.jLB.origin.rotation.y = Math.PI
                this.jLB.origin.rotation.z = Math.PI*0.5
                this.jLB.origin.position.z = -sep2

                this.jRB.origin.position.z = -sep2
                this.jRB.origin.rotation.y = Math.PI
                this.jRB.origin.rotation.z = Math.PI*0.5

                break

            }
            case(1):{
                this.jRB.Add(this.jRA)
                this.jRA.Add(this.jMA)
                this.jRA.Add(this.jLA)

                this.jLA.Add(this.jLB)

                this.jRA.Add(this.jMA)
                this.jMA.Add(this.jMB)
                this.jMA.Add(this.M)

                this.jLA.Add(this.L)
                this.jRB.Add(this.R)

                this.jMB.origin.rotation.y = Math.PI*0.5
                this.jMB.origin.position.x = 0.33

                this.jMA.origin.position.z = sep1
                this.jLA.origin.position.z = sep1*2
                this.jLA.origin.rotation.y = Math.PI

                this.jLB.origin.rotation.y = Math.PI
                this.jLB.origin.rotation.z = Math.PI*0.5
                this.jLB.origin.position.z = -sep2

                break
            }

            case(2):{
                this.jLB.Add(this.jLA)
                this.jLA.Add(this.jMA)
                this.jLA.Add(this.jRA)

                this.jRA.Add(this.jRB)

                this.jLA.Add(this.jMA)
                this.jMA.Add(this.jMB)
                this.jMA.Add(this.M)

                this.jRA.Add(this.R)
                this.jLB.Add(this.L)

                this.jMB.origin.rotation.y = Math.PI*0.5
                this.jMB.origin.position.x = 0.33

                this.jMA.origin.position.z = sep1
                this.jRA.origin.position.z = sep1*2
                this.jRA.origin.rotation.y = Math.PI

                this.jRB.origin.rotation.y = Math.PI
                this.jRB.origin.rotation.z = Math.PI*0.5
                this.jRB.origin.position.z = -sep2

                break
            }
        }
    }

    Origin(){
        switch(this.port){
            case(0):{
                return this.jMB
            }
            case(1):{
                return this.jRB
            }
            case(2):{
                return this.jLB
            }
        }
    }

    Left(angle){
        if (angle<-Math.PI*0.5){
            angle = -Math.PI*0.5;
        }
        if (angle>Math.PI*0.5){
            angle = Math.PI*0.5;
        }
        this.jLA.joint.rotation.y = angle;
    }

    Right(angle){
        if (angle<-Math.PI*0.5){
            angle = -Math.PI*0.5;
        }
        if (angle>Math.PI*0.5){
            angle = Math.PI*0.5;
        }
        this.jRA.joint.rotation.y = angle;
    }

    Remove() {
        this.M.Remove()
        this.L.Remove()
        this.R.Remove()
        this.jMA.Remove()
        this.jMB.Remove()
        this.jLA.Remove()
        this.jRA.Remove()
        this.jLB.Remove()
        this.jRB.Remove()
    }

}

// ADD FIRST CELL
let cells = [];
cells.push(await new Cell(0,0));
scene.add(cells[0].jMA.origin)
cells[0].jMA.origin.rotation.z = -Math.PI*0.5;
cells[0].jMA.origin.rotation.x = -Math.PI*0.5;

// Globals
let selection = 0
let tag = 'M';


let gui = new GUI( { title: 'Controls' } );
const API = {
    angle: 0.0,
    //leftAngle: 0.0,
    //rightAngle: 0.0,
    //color1: '#0x000000',
    //color2: '#7f00ff',

    async Extend() {
        if (selection !==-1) {
            switch (tag) {
                case('L'): { // LEFT
                    if (cells[selection].jLB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 1);
                        cells.push(cell);
                        cells[selection].jLB.Add(cell.Origin())
                    }
                    break
                }
                case('R'): { // RIGHT
                    if (cells[selection].jRB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 2);
                        cells.push(cell);
                        cells[selection].jRB.Add(cell.Origin())
                    }
                    break
                }
                case('M'): { // MIDDLE
                    if (cells[selection].jMB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 0);
                        cells.push(cell);
                        cells[selection].jMB.Add(cell.Origin())
                    }
                    break
                }
            }
        }
    },

    async Junction() {
        if (selection !==-1) {
            switch (tag) {
                case('L'): { // LEFT
                    if (cells[selection].jLB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 0);
                        cells.push(cell);
                        cells[selection].jLB.Add(cell.Origin())
                    }
                    break
                }
                case('R'): { // RIGHT
                    if (cells[selection].jRB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 0);
                        cells.push(cell);
                        cells[selection].jRB.Add(cell.Origin())
                    }
                    break
                }
                case('M'): { // MIDDLE
                    if (cells[selection].jMB.joint.children.length === 0) {
                        let cell = await new Cell(cells.length, 0);
                        cells.push(cell);
                        cells[selection].jMB.Add(cell.Origin())
                    }
                    break
                }
            }
        }
    },

    removeCell() {
        if (cells.length>1){
            cells[cells.length-1].Remove()
            cells.pop()
            selection--;
        }
    },
};


gui.add( API, 'angle', -1, 1, 0.02 ).name('Angle').onChange( function () {
    if (selection !==-1) {
        switch (tag) {
            case('L'): {
                cells[selection].Left(API.angle * Math.PI * 0.5)
                render();
                break
            }
            case('R'):{
                cells[selection].Right(API.angle * Math.PI * 0.5)
                render();
                break
            }
        }

    }
});



gui.add( API, 'Extend' ).name( 'Extend' );
gui.add( API, 'Junction' ).name( 'Junction' );
gui.add( API, 'removeCell' ).name( 'Remove' );


// RAY-CASTING
let selectedObject;
let coords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
renderer.domElement.addEventListener('mousemove', onMouseMove)
function onMouseMove(event){
    coords.set (
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(coords, camera)
    const intersections = raycaster.intersectObjects(scene.children, true)

    // RESET NON HOVER
    scene.traverse((s) => {
        s.traverse((o) => {
            if (o.isMesh) {
                //if (o.userData.index !== selection) {
                if (o.userData.index !== selection || o.userData.tag !== tag) {
                    o.material = o.userData.resetMaterial
                }
            }
        });
    });

    // HIGHLIGHT HOVER
    if (intersections.length > 0) {
        selectedObject = intersections[0].object
        selectedObject.traverse((o) => {
            if (o.isMesh) {
                if (o.userData.index !== selection) {
                    //o.material = o.userData.highlightMaterial;
                }
            }
        });
    }
}


renderer.domElement.addEventListener('mousedown', onMouseDown)
function onMouseDown(event) {
    coords.set(
        (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    )
    raycaster.setFromCamera(coords, camera)
    const intersections = raycaster.intersectObjects(scene.children, true)
    if (intersections.length === 0) {
        selection = -1 // cells.length - 1;
        scene.traverse((s) => {
            s.traverse((o) => {
                if (o.isMesh) o.material = o.userData.resetMaterial
            });
        });
    } else {
        intersections[0].object.traverse((o) => {
            if (o.isMesh) {
                tag = o.userData.tag;
                selection = o.userData.index;
                o.material = o.userData.lowlightMaterial;
            }
        });
    }
}



// ANIMATE LOOP
const timer = new Timer();
timer.connect( document );

function animate() {
    //cells[0].SetLeft(Math.sin(Math.sin(timer.getElapsed()*2)*Math.PI*0.5));
    //cells[0].SetRight(Math.sin(Math.cos(timer.getElapsed()*2)*Math.PI*0.5));
    timer.update();
    controls.update();
    directionalLight.position.set(camera.position.x,camera.position.y,camera.position.z);
    render();
}

function render() {
    renderer.render(scene, camera);
}


renderer.setAnimationLoop(animate);
