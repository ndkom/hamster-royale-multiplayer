import * as THREE from 'three';
import { createHamster } from './Hamster.js';
import { CONFIG } from './config.js';

export class Enemy {
  constructor(scene, position, team, difficulty) {
    this.scene = scene;
    this.team = team;
    this.difficulty = difficulty;
    
    this.health = difficulty.enemyHealth;
    this.maxHealth = difficulty.enemyHealth;
    this.shootCooldown = 0;
    this.velocity = new THREE.Vector3();
    
    // Create hamster model with team color
    const teamColor = team === 'red' ? CONFIG.teams.red.color : CONFIG.teams.blue.color;
    this.mesh = createHamster(teamColor);
    this.mesh.position.copy(position);
    this.mesh.userData.enemy = this; // Store reference for raycasting
    scene.add(this.mesh);

    // Health bar
    this.createHealthBar();
  }

  createHealthBar() {
    const barWidth = 1.5;
    const barHeight = 0.15;
    
    // Background
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x330000 });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarBg.position.y = 2.5;
    this.mesh.add(this.healthBarBg);

    // Fill
    const fillGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
    const fillMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
    this.healthBarFill.position.z = 0.01;
    this.healthBarBg.add(this.healthBarFill);
  }

  update(deltaTime, playerPosition, walls, enemies, obstacles = [], playerTeam = 'red') {
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }

    // Find nearest enemy from opposite team
    let target = null;
    let minDistance = Infinity;

    // Check player ONLY if they're on the opposite team
    if (this.team !== playerTeam) {
      const playerDistance = this.mesh.position.distanceTo(playerPosition);
      if (playerDistance < minDistance) {
        minDistance = playerDistance;
        target = playerPosition;
      }
    }

    // Check other team's enemies
    for (const enemy of enemies) {
      if (enemy !== this && enemy.team !== this.team) {
        const distance = this.mesh.position.distanceTo(enemy.mesh.position);
        if (distance < minDistance) {
          minDistance = distance;
          target = enemy.mesh.position;
        }
      }
    }

    if (!target) return { distance: Infinity, target: null };

    // AI behavior: move toward nearest target
    const direction = new THREE.Vector3()
      .subVectors(target, this.mesh.position)
      .normalize();

    // Stop moving if too close (personal space!)
    if (minDistance > 5) {
      this.velocity.x = direction.x * this.difficulty.enemySpeed;
      this.velocity.z = direction.z * this.difficulty.enemySpeed;

      // Check wall collisions
      const nextPosition = this.mesh.position.clone().add(
        this.velocity.clone().multiplyScalar(deltaTime)
      );

      let blocked = false;
      for (const wall of walls) {
        if (this.checkCollision(nextPosition, wall.position)) {
          blocked = true;
          break;
        }
      }

      // Check obstacle collisions
      if (!blocked) {
        for (const obstacle of obstacles) {
          const distance = Math.sqrt(
            Math.pow(nextPosition.x - obstacle.position.x, 2) +
            Math.pow(nextPosition.z - obstacle.position.z, 2)
          );
          if (distance < obstacle.radius + 1) {
            blocked = true;
            break;
          }
        }
      }

      if (!blocked) {
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
      }
    }

    // Face the player
    this.mesh.rotation.y = Math.atan2(direction.x, direction.z);

    // Keep health bars facing camera
    if (this.healthBarBg) {
      this.healthBarBg.lookAt(playerPosition);
    }

    return { distance: minDistance, target };
  }

  checkCollision(position, wallPosition) {
    const distance = Math.sqrt(
      Math.pow(position.x - wallPosition.x, 2) +
      Math.pow(position.z - wallPosition.z, 2)
    );
    return distance < 2; // Combined radius
  }

  canShoot() {
    return this.shootCooldown <= 0;
  }

  shoot(target) {
    this.shootCooldown = this.difficulty.enemyShootCooldown / 1000; // Convert to seconds
    const shootPosition = this.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const direction = new THREE.Vector3()
      .subVectors(target, shootPosition)
      .normalize();
    
    return {
      position: shootPosition,
      direction: direction,
      damage: this.difficulty.enemyDamage
    };
  }

  takeDamage(damage) {
    this.health -= damage;
    this.updateHealthBar();
    
    // Flash red when hit
    this.mesh.children[0].material.emissive.setHex(0xff0000);
    this.mesh.children[0].material.emissiveIntensity = 0.5;
    setTimeout(() => {
      if (this.mesh.children[0]) {
        this.mesh.children[0].material.emissiveIntensity = 0;
      }
    }, 100);

    return this.health <= 0;
  }

  updateHealthBar() {
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.healthBarFill.scale.x = healthPercent;
    this.healthBarFill.position.x = -(1 - healthPercent) * 0.75;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
