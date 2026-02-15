import { CONFIG } from './config.js';

export class WeaponSystem {
  constructor() {
    this.weapons = {
      RANGED: { ...CONFIG.weapons.RANGED },
      MELEE: { ...CONFIG.weapons.MELEE }
    };

    this.currentWeapon = 'RANGED';
    this.lastShotTime = 0;
    this.isReloading = false;
    this.isShooting = false;
  }

  switchWeapon(weaponKey) {
    if (this.weapons[weaponKey] && !this.isReloading) {
      this.currentWeapon = weaponKey;
      return true;
    }
    return false;
  }
  
  toggleWeapon() {
    if (!this.isReloading) {
      this.currentWeapon = this.currentWeapon === 'RANGED' ? 'MELEE' : 'RANGED';
      return true;
    }
    return false;
  }

  canShoot() {
    const weapon = this.weapons[this.currentWeapon];
    const now = Date.now();
    return !this.isReloading && 
           weapon.ammo > 0 && 
           now - this.lastShotTime >= weapon.fireRate;
  }

  shoot() {
    if (!this.canShoot()) return null;

    const weapon = this.weapons[this.currentWeapon];
    weapon.ammo--;
    this.lastShotTime = Date.now();

    // Return shot data
    const shots = [];
    const pellets = weapon.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      shots.push({
        damage: weapon.damage,
        spread: weapon.spread,
        range: weapon.range,
        color: weapon.color
      });
    }

    return shots;
  }

  reload() {
    if (this.isReloading) return false;

    const weapon = this.weapons[this.currentWeapon];
    if (weapon.ammo >= weapon.maxAmmo || weapon.ammo === Infinity) return false;

    this.isReloading = true;
    
    setTimeout(() => {
      weapon.ammo = weapon.maxAmmo;
      this.isReloading = false;
    }, weapon.reloadTime);

    return true;
  }

  getCurrentWeapon() {
    return this.weapons[this.currentWeapon];
  }

  getWeaponName() {
    return this.weapons[this.currentWeapon].name;
  }

  getAmmo() {
    return this.weapons[this.currentWeapon].ammo;
  }

  getMaxAmmo() {
    return this.weapons[this.currentWeapon].maxAmmo;
  }
}
