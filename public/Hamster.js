import * as THREE from 'three';

// 5 distinct hamster skin types with realistic color variations
const HAMSTER_SKINS = [
  {
    // Classic golden/orange hamster
    bodyColor: 0xD2691E,
    bellyColor: 0xFFE4C4,
    earColor: 0xFFB6C1,
    eyeColor: 0x1a1a1a
  },
  {
    // Brown/tan hamster
    bodyColor: 0x8B4513,
    bellyColor: 0xF5DEB3,
    earColor: 0xFFB6C1,
    eyeColor: 0x2b1a0d
  },
  {
    // Light cream hamster
    bodyColor: 0xF4A460,
    bellyColor: 0xFFF8DC,
    earColor: 0xFFC0CB,
    eyeColor: 0x000000
  },
  {
    // Dark golden hamster
    bodyColor: 0xCD853F,
    bellyColor: 0xFFEBCD,
    earColor: 0xFFB6C1,
    eyeColor: 0x0d0d0d
  },
  {
    // Reddish-brown hamster
    bodyColor: 0xA0522D,
    bellyColor: 0xFAEBD7,
    earColor: 0xFFA07A,
    eyeColor: 0x1a0d00
  }
];

// Creates a hamster character model with realistic skin variations
export function createHamster(teamColor = 0xffaa88, skinType = null) {
  const hamster = new THREE.Group();
  
  // Random skin if not specified
  if (skinType === null) {
    skinType = Math.floor(Math.random() * 5);
  }
  
  const skin = HAMSTER_SKINS[skinType];

  // Body - main fur color
  const bodyGeometry = new THREE.SphereGeometry(0.8, 20, 20);
  bodyGeometry.scale(1, 0.8, 1.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: skin.bodyColor,
    roughness: 0.85,
    metalness: 0.05
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  body.castShadow = true;
  hamster.add(body);
  
  // Belly - lighter colored belly
  const bellyGeometry = new THREE.SphereGeometry(0.65, 16, 16);
  bellyGeometry.scale(0.9, 0.8, 0.8);
  const bellyMaterial = new THREE.MeshStandardMaterial({ 
    color: skin.bellyColor,
    roughness: 0.9,
    metalness: 0.05
  });
  const belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
  belly.position.set(0, 0.5, 0.5);
  belly.castShadow = true;
  hamster.add(belly);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.5, 20, 20);
  const head = new THREE.Mesh(headGeometry, bodyMaterial);
  head.position.set(0, 1.2, 0.5);
  head.castShadow = true;
  hamster.add(head);
  
  // Face/Cheeks - lighter patch
  const cheekGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const cheek = new THREE.Mesh(cheekGeometry, bellyMaterial);
  cheek.position.set(0, 1.15, 0.7);
  cheek.scale.set(1, 0.8, 0.6);
  hamster.add(cheek);

  // Ears - pink inner ears
  const earMaterial = new THREE.MeshStandardMaterial({ 
    color: skin.earColor,
    roughness: 0.8,
    metalness: 0.1
  });
  
  const earGeometry = new THREE.SphereGeometry(0.2, 12, 12);
  const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
  leftEar.position.set(-0.3, 1.6, 0.5);
  leftEar.scale.set(0.8, 1.2, 0.6);
  leftEar.castShadow = true;
  hamster.add(leftEar);
  
  // Inner ear
  const innerEarGeometry = new THREE.SphereGeometry(0.12, 8, 8);
  const leftInnerEar = new THREE.Mesh(innerEarGeometry, earMaterial);
  leftInnerEar.position.set(-0.3, 1.58, 0.58);
  leftInnerEar.scale.set(0.7, 1, 0.5);
  hamster.add(leftInnerEar);

  const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
  rightEar.position.set(0.3, 1.6, 0.5);
  rightEar.scale.set(0.8, 1.2, 0.6);
  rightEar.castShadow = true;
  hamster.add(rightEar);
  
  const rightInnerEar = new THREE.Mesh(innerEarGeometry, earMaterial);
  rightInnerEar.position.set(0.3, 1.58, 0.58);
  rightInnerEar.scale.set(0.7, 1, 0.5);
  hamster.add(rightInnerEar);

  // Eyes - realistic beady eyes
  const eyeMaterial = new THREE.MeshStandardMaterial({ 
    color: skin.eyeColor,
    roughness: 0.3,
    metalness: 0.2,
    emissive: 0x111111,
    emissiveIntensity: 0.2
  });
  
  // Eye whites
  const eyeWhiteGeometry = new THREE.SphereGeometry(0.12, 12, 12);
  const eyeWhiteMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.1
  });
  
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  leftEyeWhite.position.set(-0.22, 1.3, 0.78);
  leftEyeWhite.scale.set(1, 1.1, 0.8);
  hamster.add(leftEyeWhite);
  
  const rightEyeWhite = new THREE.Mesh(eyeWhiteGeometry, eyeWhiteMaterial);
  rightEyeWhite.position.set(0.22, 1.3, 0.78);
  rightEyeWhite.scale.set(1, 1.1, 0.8);
  hamster.add(rightEyeWhite);
  
  // Pupils
  const pupilGeometry = new THREE.SphereGeometry(0.08, 12, 12);
  const leftPupil = new THREE.Mesh(pupilGeometry, eyeMaterial);
  leftPupil.position.set(-0.22, 1.3, 0.85);
  hamster.add(leftPupil);
  
  const rightPupil = new THREE.Mesh(pupilGeometry, eyeMaterial);
  rightPupil.position.set(0.22, 1.3, 0.85);
  hamster.add(rightPupil);
  
  // Eye shine/reflection
  const shineGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  const leftShine = new THREE.Mesh(shineGeometry, shineMaterial);
  leftShine.position.set(-0.2, 1.35, 0.88);
  hamster.add(leftShine);
  
  const rightShine = new THREE.Mesh(shineGeometry, shineMaterial);
  rightShine.position.set(0.24, 1.35, 0.88);
  hamster.add(rightShine);

  // Nose
  const noseGeometry = new THREE.SphereGeometry(0.08, 12, 12);
  const noseMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6699,
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0x550022,
    emissiveIntensity: 0.3
  });
  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 1.15, 0.93);
  hamster.add(nose);
  
  // Whisker dots (little dark spots where whiskers would grow)
  const whiskerDotGeometry = new THREE.SphereGeometry(0.02, 6, 6);
  const whiskerDotMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2b1a0d,
    roughness: 0.9
  });
  
  const whiskerPositions = [
    [-0.15, 1.12, 0.9],
    [-0.25, 1.1, 0.88],
    [0.15, 1.12, 0.9],
    [0.25, 1.1, 0.88]
  ];
  
  whiskerPositions.forEach(pos => {
    const dot = new THREE.Mesh(whiskerDotGeometry, whiskerDotMaterial);
    dot.position.set(...pos);
    hamster.add(dot);
  });

  // Paws - lighter colored like belly
  const pawGeometry = new THREE.SphereGeometry(0.2, 12, 12);
  const pawMaterial = new THREE.MeshStandardMaterial({ 
    color: skin.bellyColor,
    roughness: 0.85,
    metalness: 0.05
  });

  const pawPositions = [
    [-0.5, 0.2, 0.3],  // Front left
    [0.5, 0.2, 0.3],   // Front right
    [-0.5, 0.2, -0.3], // Back left
    [0.5, 0.2, -0.3]   // Back right
  ];

  pawPositions.forEach(pos => {
    const paw = new THREE.Mesh(pawGeometry, pawMaterial);
    paw.position.set(...pos);
    paw.scale.set(0.8, 0.6, 0.8);
    paw.castShadow = true;
    hamster.add(paw);
    
    // Paw pads
    const padGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const padMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xFFB6C1,
      roughness: 0.7
    });
    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(pos[0], pos[1] - 0.1, pos[2] + 0.15);
    pad.scale.set(0.8, 0.4, 0.8);
    hamster.add(pad);
  });
  
  // Add team indicator (colored band/collar)
  if (teamColor !== skin.bodyColor) {
    const collarGeometry = new THREE.TorusGeometry(0.55, 0.08, 8, 20);
    const collarMaterial = new THREE.MeshStandardMaterial({ 
      color: teamColor,
      roughness: 0.3,
      metalness: 0.7,
      emissive: teamColor,
      emissiveIntensity: 0.4
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.set(0, 0.9, 0.3);
    collar.rotation.x = Math.PI / 2;
    hamster.add(collar);
  }

  return hamster;
}

// Creates a simple weapon model
export function createWeapon(weaponConfig) {
  const weapon = new THREE.Group();

  // Gun body
  const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.6);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    metalness: 0.8,
    roughness: 0.3
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.z = -0.3;
  weapon.add(body);

  // Barrel
  const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
  const barrelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,
    metalness: 0.9,
    roughness: 0.2
  });
  const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.8;
  weapon.add(barrel);

  // Accent color based on weapon type
  const accentGeometry = new THREE.BoxGeometry(0.12, 0.05, 0.2);
  const accentMaterial = new THREE.MeshStandardMaterial({ 
    color: weaponConfig.color,
    emissive: weaponConfig.color,
    emissiveIntensity: 0.3,
    metalness: 0.5,
    roughness: 0.5
  });
  const accent = new THREE.Mesh(accentGeometry, accentMaterial);
  accent.position.set(0, 0.05, -0.2);
  weapon.add(accent);

  return weapon;
}
