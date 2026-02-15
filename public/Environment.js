import * as THREE from 'three';
import { CONFIG } from './config.js';

// Creates trees for the environment
export function createTree(scene, position) {
  const tree = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Foliage (3 levels)
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2d5016,
    roughness: 0.8
  });
  
  const foliagePositions = [
    { y: 3.5, radius: 1.5 },
    { y: 4.5, radius: 1.2 },
    { y: 5.3, radius: 0.8 }
  ];
  
  foliagePositions.forEach(pos => {
    const foliageGeometry = new THREE.SphereGeometry(pos.radius, 8, 8);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = pos.y;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  });
  
  tree.position.copy(position);
  scene.add(tree);
  
  return {
    mesh: tree,
    position: position,
    radius: 1.5,
    type: 'tree'
  };
}

// Creates rocks for the environment
export function createRock(scene, position) {
  const rock = new THREE.Group();
  
  // Create irregular rock shape by combining spheres
  const rockMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.95,
    metalness: 0.1
  });
  
  const mainRock = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 6),
    rockMaterial
  );
  mainRock.scale.set(1, 0.6, 0.8);
  mainRock.castShadow = true;
  mainRock.receiveShadow = true;
  rock.add(mainRock);
  
  // Add some bumps for texture
  for (let i = 0; i < 3; i++) {
    const bump = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 6, 5),
      rockMaterial
    );
    const angle = (Math.PI * 2 * i) / 3;
    bump.position.set(
      Math.cos(angle) * 0.5,
      Math.random() * 0.3,
      Math.sin(angle) * 0.5
    );
    bump.castShadow = true;
    rock.add(bump);
  }
  
  rock.position.copy(position);
  rock.position.y = 0.3;
  scene.add(rock);
  
  return {
    mesh: rock,
    position: position,
    radius: 1.2,
    type: 'rock'
  };
}

// Generate environment obstacles
export function generateEnvironment(scene, arenaSize) {
  const obstacles = [];
  const minDistance = 8; // Minimum distance between obstacles
  
  // Generate trees
  for (let i = 0; i < CONFIG.environment.treeCount; i++) {
    let attempts = 0;
    let position;
    let valid = false;
    
    while (!valid && attempts < 50) {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * arenaSize * 0.8,
        0,
        (Math.random() - 0.5) * arenaSize * 0.8
      );
      
      // Check distance from spawn point (center)
      if (position.length() < 15) {
        attempts++;
        continue;
      }
      
      // Check distance from other obstacles
      valid = true;
      for (const obstacle of obstacles) {
        if (position.distanceTo(obstacle.position) < minDistance) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    
    if (valid) {
      obstacles.push(createTree(scene, position));
    }
  }
  
  // Generate rocks
  for (let i = 0; i < CONFIG.environment.rockCount; i++) {
    let attempts = 0;
    let position;
    let valid = false;
    
    while (!valid && attempts < 50) {
      position = new THREE.Vector3(
        (Math.random() - 0.5) * arenaSize * 0.8,
        0,
        (Math.random() - 0.5) * arenaSize * 0.8
      );
      
      // Check distance from spawn point
      if (position.length() < 15) {
        attempts++;
        continue;
      }
      
      // Check distance from other obstacles
      valid = true;
      for (const obstacle of obstacles) {
        if (position.distanceTo(obstacle.position) < minDistance) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    
    if (valid) {
      obstacles.push(createRock(scene, position));
    }
  }
  
  return obstacles;
}
