import React, { useEffect, useRef, useState } from 'react';
import { Player, Stage, Projectile, Particle, InputState, Platform, AttackDefinition } from '../types';
import { sfx } from '../audio';

interface GameCanvasProps {
  player1Init: Player;
  player2Init: Player;
  stage: Stage;
  isPaused: boolean;
  isGameOver: boolean;
  onUpdateHUD: (p1: Player, p2: Player) => void;
  onWin: (winner: Player) => void;
  countdown: number | string | null;
}

export default function GameCanvas({
  player1Init,
  player2Init,
  stage,
  isPaused,
  isGameOver,
  onUpdateHUD,
  onWin,
  countdown,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronize countdown prop via ref to prevent animation loop recreation jitter
  const countdownRef = useRef<number | string | null>(countdown);
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  // Use refs to store actual physics state for perfect 60fps synchronization without state latency
  const p1Ref = useRef<Player>({ ...player1Init });
  const p2Ref = useRef<Player>({ ...player2Init });
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<number>(0);

  // Store key states
  const keysRef = useRef<Record<string, boolean>>({});

  // Dynamic Camera parameters
  const cameraRef = useRef({
    x: 500,
    y: 350,
    targetX: 500,
    targetY: 350,
    zoom: 1,
    targetZoom: 1,
  });

  // Track if upSpecial cooldown is active for air use
  const p1AirMoveRef = useRef({ usedUpSpecial: false });
  const p2AirMoveRef = useRef({ usedUpSpecial: false });

  // Handle canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Consistent canvas size for coordinates (1000x650 virtual size, scaled to fit container element)
      canvas.width = 1000;
      canvas.height = 650;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      
      // Prevent browser default scrolling with space and arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Check for single-press trigger key for Player 1 jump (W or Space)
      if (e.code === 'KeyW' || e.code === 'Space') {
        const p1 = p1Ref.current;
        if (p1.state !== 'dead' && p1.state !== 'hitstun' && !p1.shieldActive) {
          const onGround = checkOnPlatform(p1, stage).isOnGround;
          if (onGround) {
            p1.vy = -p1.character.jumpForce;
            p1.state = 'jumping';
            p1.stateTimer = 0;
            spawnCloudParticles(p1.x + p1.width / 2, p1.y + p1.height, 4);
            sfx.playJump();
          } else if (p1.doubleJumpsLeft > 0) {
            p1.vy = -p1.character.jumpForce * 0.9;
            p1.doubleJumpsLeft--;
            p1.state = 'jumping';
            p1.stateTimer = 0;
            spawnCloudParticles(p1.x + p1.width / 2, p1.y + p1.height, 6, '#bef264');
            sfx.playDoubleJump();
          }
        }
      }

      // Fighter 2 Jump key (ArrowUp) if local multiplayer
      if (e.code === 'ArrowUp' && !p2Ref.current.isCpu) {
        const p2 = p2Ref.current;
        if (p2.state !== 'dead' && p2.state !== 'hitstun' && !p2.shieldActive) {
          const onGround = checkOnPlatform(p2, stage).isOnGround;
          if (onGround) {
            p2.vy = -p2.character.jumpForce;
            p2.state = 'jumping';
            p2.stateTimer = 0;
            spawnCloudParticles(p2.x + p2.width / 2, p2.y + p2.height, 4);
            sfx.playJump();
          } else if (p2.doubleJumpsLeft > 0) {
            p2.vy = -p2.character.jumpForce * 0.9;
            p2.doubleJumpsLeft--;
            p2.state = 'jumping';
            p2.stateTimer = 0;
            spawnCloudParticles(p2.x + p2.width / 2, p2.y + p2.height, 6, '#60a5fa');
            sfx.playDoubleJump();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [stage]);

  // Main Loop
  useEffect(() => {
    let animationId: number;

    const gameTick = () => {
      if (isPaused || isGameOver) {
        animationId = requestAnimationFrame(gameTick);
        return;
      }

      updatePhysics();
      updateProjectiles();
      updateAI();
      updateParticles();
      updateCamera();
      drawGame();

      // Broadcast latest data to parent component HUD at 60fps
      onUpdateHUD({ ...p1Ref.current }, { ...p2Ref.current });

      animationId = requestAnimationFrame(gameTick);
    };

    animationId = requestAnimationFrame(gameTick);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isGameOver, stage]);

  // Helper check if character is standing on any platform of stage
  const checkOnPlatform = (p: Player, st: Stage): { isOnGround: boolean; platform: Platform | null } => {
    // If the player is moving upwards, they cannot land or stand on platforms
    if (p.vy < 0) {
      return { isOnGround: false, platform: null };
    }

    const footY = p.y + p.height;
    const pxLeft = p.x;
    const pxRight = p.x + p.width;

    // 1. Check Main Platform (non-passable solid ground)
    const main = st.mainPlatform;
    if (
      footY >= main.y &&
      footY <= main.y + p.vy + 2 &&
      pxRight >= main.x &&
      pxLeft <= main.x + main.w
    ) {
      return { isOnGround: true, platform: main };
    }

    // 2. Check Passable Platforms
    for (const plat of st.platforms) {
      if (
        footY >= plat.y &&
        footY <= plat.y + p.vy + 2 &&
        pxRight >= plat.x &&
        pxLeft <= plat.x + plat.w
      ) {
        return { isOnGround: true, platform: plat };
      }
    }

    return { isOnGround: false, platform: null };
  };

  const spawnCloudParticles = (x: number, y: number, count: number, color = '#f3f4f6') => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y: y - Math.random() * 5,
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: -Math.random() * 1.2,
        color,
        size: Math.random() * 6 + 4,
        alpha: 0.6,
        life: 0,
        maxLife: Math.random() * 25 + 15,
        type: 'smoke',
      });
    }
  };

  const spawnHitParticles = (x: number, y: number, color: string, damage: number) => {
    // Standard sparks
    const sparkCount = Math.min(10 + damage * 0.5, 30);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (4 + damage * 0.15) + 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 20 + 10,
        type: 'spark',
      });
    }

    // Expand shock ripples for heavy hit
    if (damage >= 10) {
      particlesRef.current.push({
        x,
        y,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        size: 30 + damage * 2,
        alpha: 0.9,
        life: 0,
        maxLife: 15,
        type: 'ring',
      });
    }
  };

  const spawnBlastParticles = (x: number, y: number, color: string) => {
    // Gigantic ring expansion for stock loss
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: 0,
        vy: 0,
        color,
        size: 80 + i * 40,
        alpha: 1,
        life: 0,
        maxLife: 28,
        type: 'ring',
      });
    }
    // Flying explosive clusters
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 12 + 6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#ff7849' : '#ffc82c',
        size: Math.random() * 12 + 6,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 35 + 20,
        type: 'blast',
      });
    }
  };

  // Process attacking hitbox sweeps
  const executeHitbox = (attacker: Player, defender: Player, attack: AttackDefinition) => {
    if (defender.state === 'dead' || defender.invincibleFrames > 0) return;

    // Calculate facing multipliers
    const faceDirectionMultiplier = attacker.facingLeft ? -1 : 1;

    // Calculate attack hitbox rect relative to attacker center
    const attackerCenterX = attacker.x + attacker.width / 2;
    const attackerCenterY = attacker.y + attacker.height / 2 + attack.offsetY;

    // Hitbox bounds
    const boxWidth = attack.rangeX;
    const boxHeight = attack.rangeY;
    const boxX = faceDirectionMultiplier === 1 
      ? attackerCenterX 
      : attackerCenterX - boxWidth;
    const boxY = attackerCenterY - boxHeight / 2;

    // Defender bounds
    const dxL = defender.x;
    const dxR = defender.x + defender.width;
    const dyT = defender.y;
    const dyB = defender.y + defender.height;

    // Overlap checks
    const intersects = (
      boxX < dxR &&
      boxX + boxWidth > dxL &&
      boxY < dyB &&
      boxY + boxHeight > dyT
    );

    if (intersects) {
      const midIntersectionX = Math.max(boxX, dxL) + (Math.min(boxX + boxWidth, dxR) - Math.max(boxX, dxL)) / 2;
      const midIntersectionY = Math.max(boxY, dyT) + (Math.min(boxY + boxHeight, dyB) - Math.max(boxY, dyT)) / 2;

      // Check if defender is shielding in opposite direction of collision
      const defenderFacingAttacker = (defender.facingLeft && attacker.x > defender.x) || (!defender.facingLeft && attacker.x < defender.x);
      
      if (defender.shieldActive && defender.shieldHealth > 10) {
        // Shield block!
        defender.shieldHealth = Math.max(0, defender.shieldHealth - attack.damage * 1.5);
        defender.shieldStunFrames = Math.floor(attack.damage * 0.8 + 4);
        // Minimal pushback
        defender.vx = faceDirectionMultiplier * (1 + attack.damage * 0.1);
        spawnHitParticles(midIntersectionX, midIntersectionY, '#60a5fa', 4);
        sfx.playShieldBlock();
        // Attack hit stop
        attacker.vx = -faceDirectionMultiplier * 2;
        return;
      }

      // Hit succeeds! Scale down damage velocity to make game more durable and fun
      const appliedDamage = Math.max(1, Math.round(attack.damage * 0.55));
      defender.percentage = Math.min(999, defender.percentage + appliedDamage);
      
      // SPECIAL TRAIT: Green Beast Super Armor check for physical hits
      if (defender.character.id === 'green_beast' && defender.state === 'attacking') {
        // Shakes on hit, takes damage but ignores flinching and hitstun/knockback!
        screenShakeRef.current = Math.floor(Math.min(3 + attack.damage * 0.8, 12));
        spawnHitParticles(midIntersectionX, midIntersectionY, '#22c55e', 8);
        sfx.playHit(appliedDamage);
        spawnCloudParticles(defender.x + defender.width / 2, defender.y - 12, 4, '#22c55e');
        return; // skip flinch/knockback
      }

      // Smash Bros knockback calculations - made more forgiving (starts lower, scales nicely)
      const weightBonus = 150 / defender.character.weight;
      const calculatedKnockback = attack.baseKnockback * 0.65 + (defender.percentage * attack.knockbackScale * 0.28) * weightBonus;
      
      // Hitstun frames
      defender.hitstunFrames = Math.max(9, Math.floor(calculatedKnockback * 1.6));
      defender.state = 'hitstun';
      defender.stateTimer = 0;
      defender.shieldActive = false; // break shield stance on hit
 
      // Calculate directional forces
      // For Up special, let direction launch upwards. Otherwise, launch in facing direction.
      const knockbackAngleRad = (attack.angle * Math.PI) / 180;
      
      // Horizontal component gets affected by attacker's orientation
      let forceX = Math.cos(knockbackAngleRad) * calculatedKnockback * faceDirectionMultiplier * 0.82;
      // Invert Y component if it is positive so that it always launches upwards (Y goes down in Canvas)
      let forceY = -Math.abs(Math.sin(knockbackAngleRad)) * calculatedKnockback * 0.82;

      defender.vx = forceX;
      defender.vy = forceY;

      // Juice
      screenShakeRef.current = Math.floor(Math.min(4 + attack.damage * 1.1, 18));
      spawnHitParticles(midIntersectionX, midIntersectionY, attacker.character.color, attack.damage);
      sfx.playHit(attack.damage);
    }
  };

  // Spawns a projectile from character's center
  const fireProjectile = (owner: Player) => {
    const isLeft = owner.facingLeft;
    const cid = owner.character.id;
    const spec = owner.character.attacks.neutralSpecial;

    let startX = isLeft ? owner.x - 15 : owner.x + owner.width + 15;
    let startY = owner.y + owner.height / 2 - 4;
    let velocityX = isLeft ? -9 : 9;
    let velocityY = 0;
    
    let width = 16;
    let height = 10;
    let maxLife = 60;
    let damage = spec.damage;
    let baseKnockback = spec.baseKnockback;
    let knockbackScale = spec.knockbackScale;
    let angle = spec.angle;
    let color = owner.character.color;

    if (cid === 'red_knight') {
      // Classic quick fireball
      velocityX = isLeft ? -10 : 10;
      width = 20;
      height = 14;
      maxLife = 50;
      color = '#ef4444'; // bright amber-red fire
    } else if (cid === 'blue_mage') {
      // Floaty magic Mana Orb that moves in a slow, elegant wave
      velocityX = isLeft ? -5.5 : 5.5;
      width = 24;
      height = 24;
      maxLife = 90; // travels far but slow
      color = '#3b82f6'; // magic blue
    } else if (cid === 'green_beast') {
      // Beast Roar (giant sonic burst) - massive, super wide but short-lived
      velocityX = isLeft ? -11 : 11;
      width = 44;
      height = 56;
      maxLife = 15; // disappears in a split second
      startX = isLeft ? owner.x - 45 : owner.x + owner.width;
      startY = owner.y + owner.height / 2 - 28;
      color = '#22c55e'; // neon beast green wave
    } else if (cid === 'purple_ninja') {
      // Kunai Shuriken - lightning speed, sharp, thin but quick cooldown
      velocityX = isLeft ? -16 : 16;
      width = 12;
      height = 12;
      maxLife = 40;
      color = '#c084fc'; // purple kunai
    }

    const projId = `${owner.id}_proj_${Date.now()}_${Math.random()}`;

    projectilesRef.current.push({
      id: projId,
      ownerId: owner.id,
      x: startX,
      y: startY,
      vx: velocityX,
      vy: velocityY,
      width,
      height,
      damage,
      baseKnockback,
      knockbackScale,
      angle,
      color,
      life: 0,
      maxLife,
    });

    sfx.playBeam();
  };

  // Perform movement mechanics, gravity, hitstun, actions for both players
  const updatePhysics = () => {
    const players = [p1Ref.current, p2Ref.current];

    // Tick down screen shake
    if (screenShakeRef.current > 0) {
      screenShakeRef.current--;
    }

    // Freeze players and grant full invincibility during pre-match countdown
    if (countdownRef.current !== null) {
      players.forEach((p) => {
        p.vx = 0;
        p.vy = 0;
        p.state = 'idle';
        p.invincibleFrames = 60; // hold invincibility
        p.shieldActive = false;
        p.currentAttack = null;
        p.attackTimer = 0;
      });
      return;
    }

    players.forEach((p, idx) => {
      if (p.state === 'dead') {
        p.stateTimer++;
        if (p.stateTimer > 90) {
          // Respawn player
          respawnPlayer(p);
        }
        return;
      }

      // Invincible frames tick
      if (p.invincibleFrames > 0) p.invincibleFrames--;

      // Shield active logic
      if (p.shieldActive) {
        p.shieldHealth = Math.max(0, p.shieldHealth - 0.45); // shrinks slowly while held
        p.vx *= 0.8; // decelerate fast
        if (p.shieldHealth <= 4) {
          // Shield broke! Long stun
          p.shieldActive = false;
          p.hitstunFrames = 150; // VERY long dizzy stun
          p.state = 'hitstun';
          p.stateTimer = 0;
          spawnHitParticles(p.x + p.width / 2, p.y + p.height / 2, '#fbbf24', 25);
          sfx.playShieldBreak();
        }
      } else {
        // Shield recovers slowly when not active
        p.shieldHealth = Math.min(100, p.shieldHealth + 0.2);
      }

      // Hitstun ticks
      if (p.state === 'hitstun') {
        p.hitstunFrames--;

        // Check platform and ground collisions during hitstun so players don't fall through the stage
        const groundState = checkOnPlatform(p, stage);
        const isGrounded = groundState.isOnGround;

        if (isGrounded) {
          if (p.vy > 0) {
            p.vy = 0;
            // Restore double jumps & up-specials upon landing
            if (p.id === 1) p1AirMoveRef.current.usedUpSpecial = false;
            else p2AirMoveRef.current.usedUpSpecial = false;
            p.doubleJumpsLeft = p.character.maxDoubleJumps;
          }
          p.y = groundState.platform!.y - p.height; // snap to platform top
          p.vx *= 0.82; // slide friction on ground during hitstun
        } else {
          p.vy = Math.min(15, p.vy + 0.42); // standard gravity in hitstun
          p.vx *= 0.98; // slight air resistance during hitstun
        }

        p.x += p.vx;
        p.y += p.vy;

        // Visual trailing dust during hard launches
        if (Math.abs(p.vx) > 5) {
          particlesRef.current.push({
            x: p.x + p.width / 2 + (Math.random() * 10 - 5),
            y: p.y + p.height / 2 + (Math.random() * 10 - 5),
            vx: -p.vx * 0.15,
            vy: -p.vy * 0.15,
            color: p.character.color,
            size: Math.random() * 4 + 2,
            alpha: 0.5,
            life: 0,
            maxLife: 15,
            type: 'trail',
          });
        }

        if (p.hitstunFrames <= 0) {
          p.state = 'idle';
        }
        
        // Skip normal input handling due to hitstun
        checkBlastZoneBoundaries(p);
        return;
      }

      // Attack lifecycle frames
      if (p.state === 'attacking' && p.currentAttack) {
        p.attackTimer++;
        
        // Apply active hitting frame checks
        if (p.attackTimer >= 2 && p.attackTimer <= p.currentAttack.activeFrames) {
          const defender = idx === 0 ? p2Ref.current : p1Ref.current;
          executeHitbox(p, defender, p.currentAttack);
        }

        // Action completed
        if (p.attackTimer >= p.currentAttack.activeFrames + p.currentAttack.cooldownFrames) {
          p.state = 'idle';
          p.currentAttack = null;
        }
      }

      // Read player keyboard controllers
      const input = readKeyboardInput(p.id);

      // Reset state if on ground
      const groundState = checkOnPlatform(p, stage);
      const isGrounded = groundState.isOnGround;

      if (isGrounded) {
        if (p.vy > 0) {
          p.vy = 0;
          // Clear upSpecial exhausted state when touching ground
          if (p.id === 1) p1AirMoveRef.current.usedUpSpecial = false;
          else p2AirMoveRef.current.usedUpSpecial = false;
          p.doubleJumpsLeft = p.character.maxDoubleJumps;
        }
        
        p.y = groundState.platform!.y - p.height; // snap to platform top
        
        if (p.state === 'falling' || p.state === 'jumping' || p.state === 'recovering') {
          p.state = 'idle';
          spawnCloudParticles(p.x + p.width / 2, p.y + p.height, 3);
        }
      } else {
        // Apply Gravity in air - slightly lighter to facilitate graceful recovery
        p.vy = Math.min(15, p.vy + 0.40); // terminal velocity capping
        if (p.vy > 0 && p.state !== 'attacking') {
          p.state = 'falling';
        }
      }

      // Platform drop-down through passable platform
      if (isGrounded && groundState.platform !== stage.mainPlatform && groundState.platform?.isPassable) {
        if (input.down) {
          p.y += 10; // offset slightly downwards to skip collision
          p.vy = 2;
          p.state = 'falling';
          spawnCloudParticles(p.x + p.width / 2, p.y + p.height, 2);
        }
      }

      // Apply Shielding Hold state (cannot shield if performing attacks)
      if (p.state !== 'attacking') {
        if (input.shield && isGrounded) {
          p.shieldActive = true;
          p.state = 'shielding';
        } else {
          p.shieldActive = false;
          if (p.state === 'shielding') p.state = 'idle';
        }
      }

      // X Movement processing
      if (!p.shieldActive && p.state !== 'attacking') {
        if (input.left) {
          let accel = 0.5;
          if (!isGrounded) {
            accel = 0.35; // base air acceleration
            // DI Mechanic: Hold BACKWARDS during a hard rightward launch to pull yourself back
            if (p.vx > 0) {
              accel += 0.85; // extra braking power to gain stage drift
            }
          }
          p.vx = Math.max(!isGrounded ? -p.character.speed * 1.15 : -p.character.speed, p.vx - accel);
          p.facingLeft = true;
          if (isGrounded) {
            p.state = 'running';
            if (Math.random() < 0.25) spawnCloudParticles(p.x + p.width, p.y + p.height, 1);
          }
        } else if (input.right) {
          let accel = 0.5;
          if (!isGrounded) {
            accel = 0.35; // base air acceleration
            // DI Mechanic: Hold BACKWARDS during a hard leftward launch to pull yourself back
            if (p.vx < 0) {
              accel += 0.85; // extra braking power to gain stage drift
            }
          }
          p.vx = Math.min(!isGrounded ? p.character.speed * 1.15 : p.character.speed, p.vx + accel);
          p.facingLeft = false;
          if (isGrounded) {
            p.state = 'running';
            if (Math.random() < 0.25) spawnCloudParticles(p.x, p.y + p.height, 1);
          }
        } else {
          // Horizontal friction slow down
          p.vx *= isGrounded ? 0.72 : 0.96; // slightly lighter air friction for drift conservation
          if (isGrounded && Math.abs(p.vx) < 0.2) {
            p.vx = 0;
            if (p.state === 'running') p.state = 'idle';
          }
        }

        // Apply fast fall holds
        if (!isGrounded && input.down && p.vy > 1) {
          p.vy = Math.min(14, p.vy + 0.80); // accelerate downwards
        }
      } else {
        p.vx *= 0.75; // high drag when attacking or shielding
      }

      // Attack inputs triggering (only trigger when idle/running/jumping/falling)
      const isAirUsedUpSpecial = p.id === 1 ? p1AirMoveRef.current.usedUpSpecial : p2AirMoveRef.current.usedUpSpecial;
      
      const canAct = p.state !== 'attacking' && p.state !== 'hitstun' && !p.shieldActive;

      if (canAct) {
        if (input.special) {
          // G / K Special inputs
          if (input.up && !isAirUsedUpSpecial) {
            // UP SPECIAL (LAUNCH RECOVERY STRIKE)
            p.currentAttack = p.character.attacks.upSpecial;
            p.state = 'attacking';
            p.attackTimer = 0;
            p.vy = -p.character.jumpForce * 1.24; // boost upward power substantially for safer recovery
            // Drift dynamically based on which direction key is held, fallback to facing direction
            const driftInput = input.left ? -3.2 : input.right ? 3.2 : (p.facingLeft ? -2.2 : 2.2);
            p.vx = driftInput;
            
            // Mark upSpecial spent until touch ground
            if (p.id === 1) p1AirMoveRef.current.usedUpSpecial = true;
            else p2AirMoveRef.current.usedUpSpecial = true;

            spawnCloudParticles(p.x + p.width / 2, p.y + p.height, 8, p.character.color);
            sfx.playLaunch();
          } else {
            // NEUTRAL SPECIAL (PROJECTILE ACTION)
            p.currentAttack = p.character.attacks.neutralSpecial;
            p.state = 'attacking';
            p.attackTimer = 0;
            fireProjectile(p);
          }
        } else if (input.attack) {
          // F / J Standard Normal attacks
          const isHoldingDirection = input.left || input.right;
          if (isHoldingDirection) {
            // SIDE TILT
            p.currentAttack = p.character.attacks.sideTilt;
            p.vx += p.facingLeft ? -4 : 4; // slight dash thrust
          } else {
            // JAB neutral
            p.currentAttack = p.character.attacks.jab;
          }
          p.state = 'attacking';
          p.attackTimer = 0;
        }
      }

      // X position bounds update
      p.x += p.vx;
      p.y += p.vy;

      // Blast boundaries check
      checkBlastZoneBoundaries(p);
    });
  };

  // Check if player flew past limits, triggers stock loss & explosion particles
  const checkBlastZoneBoundaries = (p: Player) => {
    const limits = stage.blastZones;
    const isOut = 
      p.x < limits.left || 
      p.x > limits.right || 
      p.y < limits.top || 
      p.y > limits.bottom;

    if (isOut) {
      p.state = 'dead';
      p.stateTimer = 0;
      p.stocks = Math.max(0, p.stocks - 1);
      
      // Ring out particle shockwave center calculations
      const clampX = Math.min(Math.max(p.x, 20), 980);
      const clampY = Math.min(Math.max(p.y, 20), 630);
      
      spawnBlastParticles(clampX, clampY, p.character.color);
      sfx.playRingOut();

      // Check for Match-over criterion
      if (p.stocks <= 0) {
        const winner = p.id === 1 ? p2Ref.current : p1Ref.current;
        onWin({ ...winner });
      }
    }
  };

  const respawnPlayer = (p: Player) => {
    p.x = 500 - p.width / 2;
    p.y = 150; // spawn safely floating above high ground
    p.vx = 0;
    p.vy = 0;
    p.percentage = 0;
    p.state = 'falling';
    p.stateTimer = 0;
    p.invincibleFrames = 150; // 2.5 seconds invincibility
    p.shieldHealth = 100;
    p.doubleJumpsLeft = p.character.maxDoubleJumps;
    
    // Clear air locks
    if (p.id === 1) p1AirMoveRef.current.usedUpSpecial = false;
    else p2AirMoveRef.current.usedUpSpecial = false;

    spawnCloudParticles(500, 180, 8, '#22d3ee');
  };

  // Keyboard mappings
  const readKeyboardInput = (id: 1 | 2): InputState => {
    if (countdownRef.current !== null) {
      return {
        left: false,
        right: false,
        up: false,
        down: false,
        attack: false,
        special: false,
        shield: false,
      };
    }
    const keys = keysRef.current;
    
    if (id === 1) {
      return {
        left: !!(keys['KeyA'] || keys['Keya']),
        right: !!(keys['KeyD'] || keys['Keyd']),
        up: !!(keys['KeyW'] || keys['Keyw'] || keys['Space']),
        down: !!(keys['KeyS'] || keys['Keys']),
        attack: !!(keys['KeyF'] || keys['Keyf']),
        special: !!(keys['KeyG'] || keys['Keyg']),
        shield: !!(keys['KeyH'] || keys['Keyh'] || keys['ShiftLeft']),
      };
    } else {
      // Return CPU action simulation if player 2 is AI
      const p2 = p2Ref.current;
      if (p2.isCpu) {
        return getCpuInput();
      }

      // Local multiplier arrow keys
      return {
        left: !!keys['ArrowLeft'],
        right: !!keys['ArrowRight'],
        up: !!keys['ArrowUp'],
        down: !!keys['ArrowDown'],
        attack: !!(keys['KeyJ'] || keys['Keyj'] || keys['Digit1'] || keys['Numpad1']),
        special: !!(keys['KeyK'] || keys['Keyk'] || keys['Digit2'] || keys['Numpad2']),
        shield: !!(keys['KeyL'] || keys['Keyl'] || keys['Digit3'] || keys['Numpad3']),
      };
    }
  };

  // Smart autonomous AI Behavior model
  const getCpuInput = (): InputState => {
    const cpu = p2Ref.current;
    const target = p1Ref.current;
    
    const input: InputState = {
      left: false, right: false, up: false, down: false, attack: false, special: false, shield: false
    };

    if (cpu.state === 'dead' || target.state === 'dead') return input;

    const dx = target.x - cpu.x;
    const dy = target.y - cpu.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // AI Difficulty settings timers
    const isHard = cpu.cpuDifficulty === 'hard';
    const isEasy = cpu.cpuDifficulty === 'easy';
    const reactFactor = isEasy ? 0.3 : isHard ? 0.9 : 0.6;

    // Check if CPU is OFF-STAGE (Recovery sequence trigger!)
    const isCpuOffstage = cpu.x < stage.mainPlatform.x - 30 || cpu.x > stage.mainPlatform.x + stage.mainPlatform.w + 30;
    
    if (isCpuOffstage) {
      // Walk towards nearest platforms
      const targetEdgeX = cpu.x < 500 ? stage.mainPlatform.x + 80 : stage.mainPlatform.x + stage.mainPlatform.w - 80;
      if (cpu.x < targetEdgeX) {
        input.right = true;
      } else {
        input.left = true;
      }

      // If falling low, trigger panic recovery leap components
      if (cpu.y > 450) {
        const isAirUsedUpSpecial = p2AirMoveRef.current.usedUpSpecial;
        if (!isAirUsedUpSpecial) {
          input.up = true;
          input.special = true; // UP SPECIAL
        } else if (cpu.doubleJumpsLeft > 0 && Math.random() < 0.2) {
          // Double jump standard key triggers
          cpu.vy = -cpu.character.jumpForce * 0.9;
          cpu.doubleJumpsLeft--;
          cpu.state = 'jumping';
          spawnCloudParticles(cpu.x + cpu.width / 2, cpu.y + cpu.height, 5, '#1e3a8a');
          sfx.playDoubleJump();
        }
      }
      return input;
    }

    // Standard fighting tracking
    if (Math.random() > reactFactor) {
      // Artificial delay lag frame mock
      return input;
    }

    // Chase Target horizontally
    if (Math.abs(dx) > 65) {
      if (dx > 0) input.right = true;
      else input.left = true;

      // Projectile poking from distance
      if (Math.abs(dx) > 180 && Math.abs(dx) < 400 && Math.random() < 0.05) {
        input.special = true; // Neutral Special Fireball poke
      }
    } else {
      // In Strike Range! Punch standard or strong tilt
      if (Math.random() < 0.45) {
        input.attack = true;
        if (Math.random() < 0.5) {
          // Side Tilt holding
          if (dx > 0) input.right = true;
          else input.left = true;
        }
      } else if (Math.random() < 0.15 && isHard) {
        // Hard CPU blocks punches!
        input.shield = true;
      }
    }

    // Jump up to follow target vertical position
    if (dy < -80 && Math.random() < 0.08) {
      const onGround = checkOnPlatform(cpu, stage).isOnGround;
      if (onGround) {
        cpu.vy = -cpu.character.jumpForce;
        cpu.state = 'jumping';
        sfx.playJump();
      } else if (cpu.doubleJumpsLeft > 0 && Math.random() < 0.2) {
        cpu.vy = -cpu.character.jumpForce * 0.9;
        cpu.doubleJumpsLeft--;
        cpu.state = 'jumping';
        sfx.playDoubleJump();
      }
    }

    // Platform drop down check if target is far below
    if (dy > 120 && Math.random() < 0.05) {
      input.down = true;
    }

    return input;
  };

  // Update projectiles flight positions and hitbox intersections
  const updateProjectiles = () => {
    if (countdownRef.current !== null) {
      projectilesRef.current = [];
      return;
    }
    const projs = projectilesRef.current;
    
    for (let i = projs.length - 1; i >= 0; i--) {
      const pr = projs[i];
      
      // Multi-character custom flight styles and trails
      const owner = pr.ownerId === 1 ? p1Ref.current : p2Ref.current;
      const cid = owner.character.id;

      if (cid === 'blue_mage') {
        // High floaty sine-wave oscillation on Y axis
        pr.y += Math.sin(pr.life * 0.16) * 3.4;
      } else if (cid === 'green_beast') {
        // Sonic sonic boom grows massive as it spreads out
        pr.width += 2.2;
        pr.height += 2.2;
        pr.y -= 1.1; // keep vertically aligned with the core
      } else if (cid === 'red_knight') {
        // Ember particle trails
        if (Math.random() < 0.35) {
          spawnHitParticles(pr.x + pr.width / 2, pr.y + pr.height / 2, '#f97316', 1);
        }
      } else if (cid === 'purple_ninja') {
        // Razor purple sparkles
        if (Math.random() < 0.25) {
          spawnHitParticles(pr.x + pr.width / 2, pr.y + pr.height / 2, '#a855f7', 1);
        }
      }

      pr.x += pr.vx;
      pr.y += pr.vy;
      pr.life++;

      // Check collision against other player
      const target = pr.ownerId === 1 ? p2Ref.current : p1Ref.current;
      
      const collidesTarget = (
        pr.x < target.x + target.width &&
        pr.x + pr.width > target.x &&
        pr.y < target.y + target.height &&
        pr.y + pr.height > target.y
      );

      if (collidesTarget && target.state !== 'dead') {
        if (target.invincibleFrames <= 0) {
          if (target.shieldActive && target.shieldHealth > 10) {
            target.shieldHealth = Math.max(0, target.shieldHealth - pr.damage * 1.5);
            target.shieldStunFrames = 6;
            spawnHitParticles(pr.x, pr.y, '#60a5fa', 3);
            sfx.playShieldBlock();
          } else {
            // Hit! Scale down projectile damage to make game more durable and fun
            const appliedDamage = Math.max(1, Math.round(pr.damage * 0.55));
            target.percentage = Math.min(999, target.percentage + appliedDamage);

            // SPECIAL TRAIT: Green Beast Super Armor check
            if (target.character.id === 'green_beast' && target.state === 'attacking') {
              // Ignores knockback but takes physical damage %
              spawnHitParticles(pr.x + pr.width / 2, pr.y + pr.height / 2, '#22c55e', pr.damage);
              sfx.playHit(pr.damage);
              spawnCloudParticles(target.x + target.width / 2, target.y - 12, 4, '#22c55e');
            } else {
              // Regular hit calculation
              const weightMultiplier = 150 / target.character.weight;
              const calculatedKnockback = pr.baseKnockback * 0.55 + (target.percentage * pr.knockbackScale * 0.24) * weightMultiplier;
              
              target.hitstunFrames = Math.max(7, Math.floor(calculatedKnockback * 1.6));
              target.state = 'hitstun';
              target.stateTimer = 0;

              const isFiredLeft = pr.vx < 0;
              target.vx = isFiredLeft ? -calculatedKnockback * 0.8 : calculatedKnockback * 0.8;
              target.vy = -calculatedKnockback * 0.35;

              spawnHitParticles(pr.x + pr.width / 2, pr.y + pr.height / 2, pr.color, pr.damage);
              sfx.playHit(pr.damage);
            }
          }
        }
        projs.splice(i, 1);
        continue;
      }

      // Check collision with outer boundaries or expired life
      if (pr.life > pr.maxLife) {
        projs.splice(i, 1);
      }
    }
  };

  // Artificial CPU controller hook mock
  const updateAI = () => {
    // Done inside readKeyboardInput dynamically for cleaner loop synchronization!
  };

  // Particles animation tick updates
  const updateParticles = () => {
    const parts = particlesRef.current;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++;
      
      // Ring particle expand sizes without coordinates shifts
      if (p.type === 'ring') {
        p.size += 2.5;
        p.alpha = 1 - p.life / p.maxLife;
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - p.life / p.maxLife;
      }

      if (p.life >= p.maxLife) {
        parts.splice(i, 1);
      }
    }
  };

  // Smooth zooming camera based on player bounding distances
  const updateCamera = () => {
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;
    const cam = cameraRef.current;

    // Center coordinates
    const p1CenterX = p1.x + p1.width / 2;
    const p1CenterY = p1.y + p1.height / 2;
    const p2CenterX = p2.x + p2.width / 2;
    const p2CenterY = p2.y + p2.height / 2;

    const midX = (p1CenterX + p2CenterX) / 2;
    const midY = (p1CenterY + p2CenterY) / 2;

    // Clip center coordinate inside safe boundary zones (wider for expanded blast zones)
    cam.targetX = Math.min(Math.max(midX, 200), 800);
    cam.targetY = Math.min(Math.max(midY, 150), 450);

    // Bounding bounds distance calculation
    const dx = Math.abs(p1CenterX - p2CenterX);
    const dy = Math.abs(p1CenterY - p2CenterY);
    const maxDistance = Math.max(dx * 1.05, dy * 1.5, 300);

    // Interpolate camera zoom factors (allow zoom-out up to 0.45 to capture offstage battles)
    const baseZoom = 700 / maxDistance;
    cam.targetZoom = Math.min(Math.max(baseZoom, 0.45), 1.2);

    // Smooth transition interpolation damping
    cam.x += (cam.targetX - cam.x) * 0.08;
    cam.y += (cam.targetY - cam.y) * 0.08;
    cam.zoom += (cam.targetZoom - cam.zoom) * 0.08;
  };

  // Drawing routines using canvas API
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Screen Shake offsets
    ctx.save();
    if (screenShakeRef.current > 0) {
      const dx = (Math.random() * 2 - 1) * screenShakeRef.current * 0.65;
      const dy = (Math.random() * 2 - 1) * screenShakeRef.current * 0.65;
      ctx.translate(dx, dy);
    }

    // Stage Background Gradients (Wait, canvas gradient mimics stage setting)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (stage.id === 'battlefield') {
      bgGrad.addColorStop(0, '#060a12');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#020617');
    } else if (stage.id === 'space_station') {
      bgGrad.addColorStop(0, '#030712');
      bgGrad.addColorStop(0.6, '#0f172a');
      bgGrad.addColorStop(1, '#020617');
    } else {
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(0.5, '#2e1065');
      bgGrad.addColorStop(1, '#020617');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background nebula aesthetics
    drawStarsBackground(ctx);

    // Apply Camera Transforms (Zooming and Translating to midpoints)
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    // Draw Blast Zones border boundaries references (Dashed glowing guides)
    drawBlastGuides(ctx);

    // Draw Platforms
    drawStagePlatforms(ctx);

    // Draw Projectiles
    drawGameProjectiles(ctx);

    // Draw Particles
    drawGameParticles(ctx);

    // Draw Players
    drawFighter(ctx, p1Ref.current);
    drawFighter(ctx, p2Ref.current);

    // Revert context transforms
    ctx.restore();
  };

  const drawStarsBackground = (ctx: CanvasRenderingContext2D) => {
    // Star spots drawing routines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(150, 100, 1.2, 0, Math.PI * 2);
    ctx.arc(850, 140, 1.5, 0, Math.PI * 2);
    ctx.arc(450, 80, 1, 0, Math.PI * 2);
    ctx.arc(300, 500, 1.5, 0, Math.PI * 2);
    ctx.arc(700, 480, 1.2, 0, Math.PI * 2);
    ctx.arc(920, 310, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cosmic dust grid rings
    if (stage.id === 'space_station') {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(500, 325, 400, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawBlastGuides = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.04)';
    ctx.setLineDash([5, 10]);
    ctx.lineWidth = 3;
    ctx.strokeRect(stage.blastZones.left, stage.blastZones.top, stage.blastZones.right - stage.blastZones.left, stage.blastZones.bottom - stage.blastZones.top);
    ctx.setLineDash([]);
  };

  const drawStagePlatforms = (ctx: CanvasRenderingContext2D) => {
    // 1. Draw Main Platform Ground
    const ground = stage.mainPlatform;
    
    // Ambient platform shadow/glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6366f1';
    
    const floorGrad = ctx.createLinearGradient(ground.x, ground.y, ground.x, ground.y + ground.h);
    floorGrad.addColorStop(0, '#1e1b4b');
    floorGrad.addColorStop(0.3, '#312e81');
    floorGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = floorGrad;
    ctx.fillRect(ground.x, ground.y, ground.w, ground.h);

    // Glowing stage top ledge lines
    ctx.shadowBlur = 0; // reset shadow
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(ground.x, ground.y, ground.w, 4);

    // 2. Draw Floating Passable platforms
    stage.platforms.forEach(plat => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#bef264'; // neon yellow-green accent top line
      ctx.fillRect(plat.x, plat.y, plat.w, 2);
    });
  };

  const drawFighter = (ctx: CanvasRenderingContext2D, p: Player) => {
    if (p.state === 'dead') return;

    const isInvincibleFlashing = p.invincibleFrames > 0 && Math.floor(p.invincibleFrames / 4) % 2 === 0;
    if (isInvincibleFlashing) {
      // translucent alpha flash
      ctx.globalAlpha = 0.35;
    }

    const faceDirectionMultiplier = p.facingLeft ? -1 : 1;

    // Draw active attacking swings!
    if (p.state === 'attacking' && p.currentAttack) {
      ctx.fillStyle = `${p.character.color}25`;
      ctx.strokeStyle = p.character.color;
      ctx.lineWidth = 2;
      
      const pCenterX = p.x + p.width / 2;
      const pCenterY = p.y + p.height / 2 + p.currentAttack.offsetY;
      
      const width = p.currentAttack.rangeX;
      const height = p.currentAttack.rangeY;
      const x = faceDirectionMultiplier === 1 ? pCenterX : pCenterX - width;
      const y = pCenterY - height / 2;

      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Draw Character Body Box
    ctx.fillStyle = p.character.color;
    // Glow during recovering leaps
    if (p.state === 'attacking' && p.currentAttack?.name.includes('Hero Leap')) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.character.color;
    }

    // Render cute platformer character model with facial highlights
    ctx.beginPath();
    // Rounded box body
    ctx.roundRect(p.x, p.y, p.width, p.height, 10);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Highlight border stroke matching character accent
    ctx.strokeStyle = p.character.accentColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Spawn character face visor facing the current horizontal displacement
    ctx.fillStyle = '#ffffff';
    const faceX = p.facingLeft ? p.x + 6 : p.x + p.width - 14;
    const faceY = p.y + 10;
    ctx.fillRect(faceX, faceY, 8, 6);

    // DRAW UNIQUE FIGHTER ACCESSORIES / GEAR FOR CHARACTER DIFFERENTIATION
    const cid = p.character.id;
    if (cid === 'red_knight') {
      // Draw a sleek silver sword blade & golden hilt in its hand/side
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (p.facingLeft) {
        ctx.moveTo(p.x - 2, p.y + p.height - 10);
        ctx.lineTo(p.x - 14, p.y + p.height - 24);
      } else {
        ctx.moveTo(p.x + p.width + 2, p.y + p.height - 10);
        ctx.lineTo(p.x + p.width + 14, p.y + p.height - 24);
      }
      ctx.stroke();
      // Draw sword golden handle guard
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.facingLeft ? p.x - 2 : p.x + p.width + 2, p.y + p.height - 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (cid === 'blue_mage') {
      // Draw a magical crystal sapphire staff
      const orbX = p.facingLeft ? p.x - 6 : p.x + p.width + 6;
      ctx.strokeStyle = '#78350f'; // mahogany wood
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(orbX, p.y + 10);
      ctx.lineTo(orbX, p.y + p.height + 4);
      ctx.stroke();

      // Magic jewel glowing orb
      ctx.fillStyle = '#60a5fa';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      ctx.arc(orbX, p.y + 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    } else if (cid === 'green_beast') {
      // Draw spiky dark green dinosaur or beast ridges along his back
      ctx.fillStyle = '#15803d'; // deep beast green spikes
      const spikeX = p.facingLeft ? p.x + p.width : p.x;
      ctx.beginPath();
      if (p.facingLeft) {
        // Pointing rightward on the right edge
        ctx.moveTo(spikeX, p.y + 6);
        ctx.lineTo(spikeX + 5, p.y + 11);
        ctx.lineTo(spikeX, p.y + 16);
        
        ctx.moveTo(spikeX, p.y + 18);
        ctx.lineTo(spikeX + 5, p.y + 23);
        ctx.lineTo(spikeX, p.y + 28);
      } else {
        // Pointing leftward on the left edge
        ctx.moveTo(spikeX, p.y + 6);
        ctx.lineTo(spikeX - 5, p.y + 11);
        ctx.lineTo(spikeX, p.y + 16);
        
        ctx.moveTo(spikeX, p.y + 18);
        ctx.lineTo(spikeX - 5, p.y + 23);
        ctx.lineTo(spikeX, p.y + 28);
      }
      ctx.fill();
    } else if (cid === 'purple_ninja') {
      // Draw an elegant violet ninja scarf tail flowing backward in motion
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      const scarfX = p.facingLeft ? p.x + p.width - 2 : p.x + 2;
      ctx.moveTo(scarfX, p.y + 12);
      ctx.bezierCurveTo(
        p.facingLeft ? scarfX + 12 : scarfX - 12, p.y + 4,
        p.facingLeft ? scarfX + 18 : scarfX - 18, p.y + 18,
        p.facingLeft ? scarfX + 26 : scarfX - 26, p.y + 10
      );
      ctx.bezierCurveTo(
        p.facingLeft ? scarfX + 18 : scarfX - 18, p.y + 22,
        p.facingLeft ? scarfX + 12 : scarfX - 12, p.y + 10,
        scarfX, p.y + 16
      );
      ctx.fill();
    }

    // Glowing double jump halo details
    if (p.doubleJumpsLeft > 0 && p.state === 'jumping') {
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height + 6, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Shield Sphere Orb if active shielding is held down
    if (p.shieldActive && p.shieldHealth > 5) {
      ctx.save();
      const radius = 28 * (p.shieldHealth / 100);
      const shieldCenterX = p.x + p.width / 2;
      const shieldCenterY = p.y + p.height / 2;
      
      // Radiant glossy gradient
      const shieldGrad = ctx.createRadialGradient(
        shieldCenterX - 5, shieldCenterY - 5, 2,
        shieldCenterX, shieldCenterY, radius
      );
      shieldGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      shieldGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.3)');
      shieldGrad.addColorStop(1, 'rgba(14, 165, 233, 0.65)');

      ctx.fillStyle = shieldGrad;
      ctx.beginPath();
      ctx.arc(shieldCenterX, shieldCenterY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Floating identification indicators above fighter (P1 or CPU Lv)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const textLabel = p.id === 1 ? '1P' : p.isCpu ? `CPU LV.${p.cpuDifficulty.toUpperCase()}` : '2P';
    ctx.fillText(textLabel, p.x + p.width / 2, p.y - 12);

    // Draw floating damage indicator briefly inside hitstun
    if (p.state === 'hitstun' && p.hitstunFrames > 25) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`${Math.floor(p.percentage)}%`, p.x + p.width / 2, p.y - 28);
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;
  };

  const drawGameProjectiles = (ctx: CanvasRenderingContext2D) => {
    projectilesRef.current.forEach(pr => {
      ctx.fillStyle = pr.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = pr.color;
      
      ctx.beginPath();
      ctx.roundRect(pr.x, pr.y, pr.width, pr.height, 4);
      ctx.fill();
      
      ctx.shadowBlur = 0; // reset
    });
  };

  const drawGameParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  };

  return (
    <div className="w-full h-full relative" id="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-slate-950 rounded-3xl"
        id="battle-stage-canvas"
      />
    </div>
  );
}
