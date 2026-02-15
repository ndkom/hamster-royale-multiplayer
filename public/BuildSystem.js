import * as THREE from 'three';
import { CONFIG } from './config.js';

export class BuildSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.maxWalls = CONFIG.build.maxWalls;
    this.previewWall = this.createPreviewWall();
    this.previewWall.visible = false;
    scene.add(this.previewWall);
  }

  createPreviewWall() {
    const geometry = new THREE.BoxGeometry(3, 3, 0.5);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      emissive: 0xffaa00,
      emissiveIntensity: 0.3
    });
    const wall = new THREE.Mesh(geometry, material);
    return wall;
  }

  createWall(position) {
    const geometry = new THREE.BoxGeometry(3, 3, 0.5);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1
    });
    const wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    wall.position.y = 1.5; // Half height
    wall.castShadow = true;
    wall.receiveShadow = true;

    const wallData = {
      mesh: wall,
      position: position,
      health: CONFIG.build.wallHealth,
      maxHealth: CONFIG.build.wallHealth
    };

    this.walls.push(wallData);
    this.scene.add(wall);

    return wallData;
  }

  updatePreview(playerPosition, cameraRotation, canPlaceNow) {
    // Always show preview
    this.previewWall.visible = true;

    // Place preview in front of player (negative direction for forward)
    const distance = CONFIG.build.placementRange;
    const x = playerPosition.x - Math.sin(cameraRotation) * distance;
    const z = playerPosition.z - Math.cos(cameraRotation) * distance;
    
    this.previewWall.position.set(x, 1.5, z);
    this.previewWall.rotation.y = cameraRotation;

    // Check if placement is valid
    const canPlace = this.canPlaceWall(this.previewWall.position) && canPlaceNow;
    if (canPlace) {
      this.previewWall.material.color.setHex(0x00ff00);
      this.previewWall.material.emissive.setHex(0x00ff00);
      this.previewWall.material.emissiveIntensity = 0.5;
      this.previewWall.material.opacity = 0.6;
    } else {
      this.previewWall.material.color.setHex(0xff0000);
      this.previewWall.material.emissive.setHex(0xff0000);
      this.previewWall.material.emissiveIntensity = 0.5;
      this.previewWall.material.opacity = 0.4;
    }
  }

  canPlaceWall(position) {
    if (this.walls.length >= this.maxWalls) return false;

    // Check if too close to other walls
    for (const wall of this.walls) {
      const distance = position.distanceTo(wall.position);
      if (distance < 4) return false;
    }

    return true;
  }

  placeWall(playerPosition, cameraRotation) {
    if (this.walls.length >= this.maxWalls) {
      console.log('Max walls reached!');
      return false;
    }

    const position = this.previewWall.position.clone();
    if (!this.canPlaceWall(position)) {
      console.log('Cannot place wall here!');
      return false;
    }

    const wall = this.createWall(position);
    wall.mesh.rotation.y = cameraRotation;
    console.log('Wall placed successfully!');
    return true;
  }

  damageWall(wall, damage) {
    wall.health -= damage;
    
    // Visual feedback
    wall.mesh.material.emissive.setHex(0xff0000);
    wall.mesh.material.emissiveIntensity = 0.5;
    setTimeout(() => {
      if (wall.mesh.material) {
        wall.mesh.material.emissiveIntensity = 0;
      }
    }, 100);

    if (wall.health <= 0) {
      this.destroyWall(wall);
      return true;
    }
    return false;
  }

  destroyWall(wall) {
    const index = this.walls.indexOf(wall);
    if (index > -1) {
      this.walls.splice(index, 1);
      this.scene.remove(wall.mesh);
    }
  }

  getWalls() {
    return this.walls;
  }

  // Create wall from network event (another player placed it)
  createWallFromNetwork(position, rotation) {
    // Check if wall already exists at this position
    for (const wall of this.walls) {
      const dist = Math.sqrt(
        Math.pow(wall.position.x - position.x, 2) +
        Math.pow(wall.position.z - position.z, 2)
      );
      if (dist < 1) return; // Already exists
    }

    const wall = this.createWall(position);
    wall.mesh.rotation.y = rotation;
    console.log('Wall synced from network');
  }

  // Remove wall at position (from network event)
  removeWallAt(position) {
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const wall = this.walls[i];
      const dist = Math.sqrt(
        Math.pow(wall.position.x - position.x, 2) +
        Math.pow(wall.position.z - position.z, 2)
      );
      if (dist < 2) {
        this.scene.remove(wall.mesh);
        this.walls.splice(i, 1);
        console.log('Wall removed from network');
        return;
      }
    }
  }

  destroy() {
    this.scene.remove(this.previewWall);
    this.walls.forEach(wall => this.scene.remove(wall.mesh));
  }
}
