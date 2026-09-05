const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;

const WRAP_BUFFER = 5;

const NUM_BODIES = 3;

const MIN_RADIUS = 50;
const MAX_RADIUS = 90;

const MAX_BODIES = 360;
const MAX_COLLISION_CHECKS_PER_FRAME = 18000;
const MAX_FRACTURES_PER_FRAME = 2;

let checkedCollisionPairs = new Set();

const SPATIAL_CELL_SIZE = MAX_RADIUS * 2.5;

let spatialGrid = new Map();
let collisionChecksThisFrame = 0;
let fracturesThisFrame = 0;

const MIN_VELOCITY = -200;
const MAX_VELOCITY = 200;

const GRAVITY_STRENGTH = 300;
const SOFTENING = 20;

const USE_BARNES_HUT_GRAVITY = true;

// Lower = more accurate, slower.
// Higher = faster, more approximate.
const BARNES_HUT_THETA = 0.45;

const BARNES_HUT_MAX_DEPTH = 12;
const BARNES_HUT_MIN_NODE_SIZE = 2;

let gravityTree = null;

const ELASTICITY = 0.55;
const FRICTION = 0.95;
const ANGULAR_DAMPING = 0.999;

const COLLISION_ITERATIONS = 4;

// Fracture settings
// Material binding settings
// Higher = bodies are harder to fracture.
// Lower = bodies fracture more easily.
const MATERIAL_BINDING_STRENGTH = 2000;
const FRACTURE_FRAGMENT_EFFICIENCY = 0.5;
const MAX_FRACTURE_SEARCH_COUNT = 20;
const FRAGMENT_PLACEMENT_ATTEMPTS_PER_FRAGMENT = 45;
const FRACTURE_SIZE_FALLOFF = 1.0;
const MIN_FRAGMENT_SIZE_WEIGHT = 0.25;
const MAX_FRAGMENT_SIZE_WEIGHT = 2;

const LOCAL_FRACTURE_CURVE_RESOLUTION = 32;
const LOCAL_FRACTURE_MAX_NORMALIZED_IMPACT = 2.0;

let localFractureDamageSamples = [];

const VARIABLE_FRAGMENT_LAYOUT_ATTEMPTS = 5;

const NEAR_FRAGMENT_ANGLE_SPREAD = Math.PI * 0.15;
const FAR_FRAGMENT_ANGLE_SPREAD = Math.PI * 0.85;

// Converts lost/untracked fracture mass into stored heat.
// Higher = hotter fractures / stronger bloom response.
const LOST_MASS_TO_HEAT = 200;

// How fracture heat is distributed.
const FRACTURE_HEAT_TO_FRAGMENTS = 0.85;
const FRACTURE_HEAT_TO_ORIGINAL = 0.15;

// Heat visual contribution.
const HEAT_VISUAL_WEIGHT = 1.0;

// Keeps this percent of heat per second.
// Lower = heat fades faster.
const HEAT_DECAY_PER_SECOND = 0.7;

const MIN_FRAGMENTS = 1;
const MAX_FRAGMENTS = 18;

const MIN_FRAGMENT_RADIUS = 1;

// Local fracture model.
// Higher = smaller impacts can break off more material.
const LOCAL_FRACTURE_FALLOFF = 2.0;

// Minimum local damage needed before a visible chip can happen.
const MIN_LOCAL_DAMAGE_TO_FRACTURE = 0.001;

// Only this percent of the local impact energy transfers into fragment velocity.
// The rest is treated as dissipated heat/deformation/cracking.
const FRACTURE_ENERGY_TRANSFER_PERCENT = 0.01;

// Prevent the original body from being reduced to nothing.
const MIN_REMAINING_BODY_RADIUS = MIN_FRAGMENT_RADIUS * 2;

const MIN_MASS_LOSS_PERCENT = 0.1;
const MAX_MASS_LOSS_PERCENT = 0.9;

const MAX_FRACTURE_SEVERITY = 6;

// Visual energy / bloom settings
const VISUAL_ENERGY_SCALE = 12000000;
const LOG_VISUAL_ENERGY_SCALE = Math.log(1 + VISUAL_ENERGY_SCALE);

// Weight order:
// 1. linear velocity = strongest
// 2. angular velocity = strong
// 3. nearby gravity bodies = weak
const LINEAR_VISUAL_WEIGHT = 1.0;
const ANGULAR_VISUAL_WEIGHT = 0.85;
const GRAVITY_NEIGHBOR_VISUAL_WEIGHT = 0.5;

// How close another body must be to contribute noticeably to glow
const GRAVITY_NEIGHBOR_VISUAL_RANGE = MAX_RADIUS * 2.1;

// Bloom rendering
const BLOOM_LAYERS = 5;
const MIN_BLOOM_ALPHA = 0;
const MAX_BLOOM_ALPHA = 25;

const MIN_BLOOM_EXTRA_RADIUS = 2;
const MAX_BLOOM_EXTRA_RADIUS = 20;

// Smaller bodies with equal energy glow more intensely and farther
const SMALL_BODY_BLOOM_INTENSITY_BOOST = 1.05;
const SMALL_BODY_BLOOM_RADIUS_BOOST = 1.1;

// Large bodies still glow, but more subtly
const LARGE_BODY_BLOOM_INTENSITY_MULT = 0.15;
const LARGE_BODY_BLOOM_RADIUS_MULT = 0.25;

let bodies = [];
let pendingFragments = [];

const MAX_SIMULATION_TIME = 30; // seconds
let simulatedTime = 0;

function setup() {
  pixelDensity(1);
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  buildLocalFractureCurveSamples();

  for (let i = 0; i < NUM_BODIES; i++) {
    bodies.push(new GravityBody());
  }
}

function resetSimulation() {
  simulatedTime = 0;
  bodies = [];
  pendingFragments = [];

  for (let i = 0; i < NUM_BODIES; i++) {
    bodies.push(new GravityBody());
  }
}

function draw() {
  background(10);

  let t = Math.min(deltaTime / 1000, 0.033);
  simulatedTime += t;
  if (simulatedTime > MAX_SIMULATION_TIME) resetSimulation();
  pendingFragments = [];

  for (let i = 0; i < bodies.length; i++) {
    bodies[i].resetAcceleration();
  }

  if (USE_BARNES_HUT_GRAVITY) {
    buildGravityTree();

    for (let i = 0; i < bodies.length; i++) {
      applyBarnesHutGravity(bodies[i], gravityTree);
    }
  } else {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        applyGravity(bodies[i], bodies[j]);
      }
    }
  }

  for (let i = 0; i < bodies.length; i++) {
    bodies[i].update(t);
  }

  collisionChecksThisFrame = 0;
  fracturesThisFrame = 0;

  buildSpatialGrid();

  for (let iter = 0; iter < COLLISION_ITERATIONS; iter++) {
    solveSpatialCollisions();
  }

  for (let i = 0; i < pendingFragments.length; i++) {
    bodies.push(pendingFragments[i]);
  }

  for (let i = 0; i < bodies.length; i++) {
    bodies[i].cacheBloomData();
    bodies[i].draw();
  }

  fill(255);
  noStroke();
  textSize(20);
  text("FPS: " + frameRate().toFixed(1), 20, 30);

  fill(255);
  noStroke();
  textSize(20);
  text("Bodies: " + bodies.length, 20, 60);

  fill(255);
  noStroke();
  textSize(20);
  text("Simulation Time: " + simulatedTime.toFixed(1), 20, 90);
}

function buildLocalFractureCurveSamples() {
  localFractureDamageSamples = [];

  for (let i = 0; i < LOCAL_FRACTURE_CURVE_RESOLUTION; i++) {
    let percent = i / (LOCAL_FRACTURE_CURVE_RESOLUTION - 1);

    let normalizedImpact = percent * LOCAL_FRACTURE_MAX_NORMALIZED_IMPACT;

    let localDamage = 1 - Math.exp(-LOCAL_FRACTURE_FALLOFF * normalizedImpact);

    localDamage = constrain(localDamage, 0, 1);

    localFractureDamageSamples.push(localDamage);
  }
}

function sampleLocalFractureDamage(normalizedImpact) {
  if (normalizedImpact <= 0) {
    return 0;
  }

  normalizedImpact = constrain(
    normalizedImpact,
    0,
    LOCAL_FRACTURE_MAX_NORMALIZED_IMPACT,
  );

  let percent = normalizedImpact / LOCAL_FRACTURE_MAX_NORMALIZED_IMPACT;

  let index = round(percent * (LOCAL_FRACTURE_CURVE_RESOLUTION - 1));

  return localFractureDamageSamples[index];
}

function getSampledNormalizedImpactForDamage(requiredDamage) {
  requiredDamage = constrain(requiredDamage, 0, 1);

  for (let i = 0; i < localFractureDamageSamples.length; i++) {
    if (localFractureDamageSamples[i] >= requiredDamage) {
      let percent = i / (LOCAL_FRACTURE_CURVE_RESOLUTION - 1);
      return percent * LOCAL_FRACTURE_MAX_NORMALIZED_IMPACT;
    }
  }

  return Infinity;
}

function buildSpatialGrid() {
  spatialGrid.clear();

  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];

    let cellX = floor(wrapX(body.x) / SPATIAL_CELL_SIZE);
    let cellY = floor(wrapY(body.y) / SPATIAL_CELL_SIZE);

    cellX = constrain(cellX, 0, GRID_COLS - 1);
    cellY = constrain(cellY, 0, GRID_ROWS - 1);

    let key = getCellKey(cellX, cellY);

    if (!spatialGrid.has(key)) {
      spatialGrid.set(key, []);
    }

    spatialGrid.get(key).push(i);
  }
}

function solveSpatialCollisions() {
  checkedCollisionPairs.clear();

  for (let i = 0; i < bodies.length; i++) {
    let a = bodies[i];

    let cellX = floor(wrapX(a.x) / SPATIAL_CELL_SIZE);
    let cellY = floor(wrapY(a.y) / SPATIAL_CELL_SIZE);

    cellX = constrain(cellX, 0, GRID_COLS - 1);
    cellY = constrain(cellY, 0, GRID_ROWS - 1);

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        let neighborX = wrapCell(cellX + ox, GRID_COLS);
        let neighborY = wrapCell(cellY + oy, GRID_ROWS);

        let key = getCellKey(neighborX, neighborY);
        let cellBodies = spatialGrid.get(key);

        if (!cellBodies) {
          continue;
        }

        for (let c = 0; c < cellBodies.length; c++) {
          let j = cellBodies[c];

          if (j <= i) {
            continue;
          }

          let pairKey = i * MAX_BODIES + j;

          if (checkedCollisionPairs.has(pairKey)) {
            continue;
          }

          checkedCollisionPairs.add(pairKey);

          collideBodies(bodies[i], bodies[j]);

          collisionChecksThisFrame++;

          if (collisionChecksThisFrame >= MAX_COLLISION_CHECKS_PER_FRAME) {
            return;
          }
        }
      }
    }
  }
}

function applyGravity(a, b) {
  let dx = shortestDeltaAxis(a.x, b.x, CANVAS_WIDTH);
  let dy = shortestDeltaAxis(a.y, b.y, CANVAS_HEIGHT);

  let distanceSq = dx * dx + dy * dy + SOFTENING;
  let distance = sqrt(distanceSq);

  let dirX = dx / distance;
  let dirY = dy / distance;

  let accelA = (GRAVITY_STRENGTH * b.mass) / distanceSq;
  let accelB = (GRAVITY_STRENGTH * a.mass) / distanceSq;

  a.xAccel += dirX * accelA;
  a.yAccel += dirY * accelA;

  b.xAccel -= dirX * accelB;
  b.yAccel -= dirY * accelB;

  accumulateVisualGravityInfluence(a, b, distanceSq);
}

function accumulateVisualGravityInfluence(a, b, distanceSq) {
  let rangeSq = GRAVITY_NEIGHBOR_VISUAL_RANGE * GRAVITY_NEIGHBOR_VISUAL_RANGE;

  if (distanceSq > rangeSq) {
    return;
  }

  let closeness = 1 - distanceSq / rangeSq;
  closeness = constrain(closeness, 0, 1);

  // Count nearby bodies lightly, but weight closer/more massive bodies slightly more.
  a.nearbyGravityInfluence += closeness * b.mass;
  b.nearbyGravityInfluence += closeness * a.mass;
}

function collideBodies(a, b) {
  let dx = shortestDeltaAxis(a.x, b.x, CANVAS_WIDTH);
  let dy = shortestDeltaAxis(a.y, b.y, CANVAS_HEIGHT);

  let minDistance = a.radius + b.radius;
  let minDistanceSq = minDistance * minDistance;

  let distanceSq = dx * dx + dy * dy;

  if (distanceSq >= minDistanceSq) {
    return;
  }

  let distance = sqrt(distanceSq);

  if (distance === 0) {
    distance = 0.01;
    dx = 0.01;
    dy = 0;
  }

  let nx = dx / distance;
  let ny = dy / distance;

  // B's nearest connected copy relative to A.
  let bLocalX = a.x + dx;
  let bLocalY = a.y + dy;

  let contactAX = a.x + nx * a.radius;
  let contactAY = a.y + ny * a.radius;

  let contactBX = bLocalX - nx * b.radius;
  let contactBY = bLocalY - ny * b.radius;

  let contactX = (contactAX + contactBX) * 0.5;
  let contactY = (contactAY + contactBY) * 0.5;

  let overlap = minDistance - distance;
  let totalMass = a.mass + b.mass;

  a.x -= nx * overlap * (b.mass / totalMass);
  a.y -= ny * overlap * (b.mass / totalMass);

  b.x += nx * overlap * (a.mass / totalMass);
  b.y += ny * overlap * (a.mass / totalMass);

  let raX = contactX - a.x;
  let raY = contactY - a.y;

  let rbX = contactX - b.x;
  let rbY = contactY - b.y;

  let va = a.getVelocityAtPoint(contactX, contactY);
  let vb = b.getVelocityAtPoint(contactX, contactY);

  let rvx = vb.x - va.x;
  let rvy = vb.y - va.y;

  let velocityAlongNormal = rvx * nx + rvy * ny;
  let impactSpeed = max(0, -velocityAlongNormal);

  let reducedMass = (a.mass * b.mass) / (a.mass + b.mass);
  let impactEnergy = 0.5 * reducedMass * impactSpeed * impactSpeed;

  if (impactEnergy >= a.minFractureImpactEnergy) {
    tryFracture(a, impactEnergy, contactX, contactY, -nx, -ny);
  }

  if (impactEnergy >= b.minFractureImpactEnergy) {
    tryFracture(b, impactEnergy, contactX, contactY, nx, ny);
  }

  if (velocityAlongNormal > 0) {
    return;
  }

  let raCrossN = cross2D(raX, raY, nx, ny);
  let rbCrossN = cross2D(rbX, rbY, nx, ny);

  let invMassSum =
    a.invMass +
    b.invMass +
    raCrossN * raCrossN * a.invInertia +
    rbCrossN * rbCrossN * b.invInertia;

  let normalImpulseMag = (-(1 + ELASTICITY) * velocityAlongNormal) / invMassSum;

  let impulseX = normalImpulseMag * nx;
  let impulseY = normalImpulseMag * ny;

  a.applyImpulse(-impulseX, -impulseY, contactX, contactY);
  b.applyImpulse(impulseX, impulseY, contactX, contactY);

  va = a.getVelocityAtPoint(contactX, contactY);
  vb = b.getVelocityAtPoint(contactX, contactY);

  rvx = vb.x - va.x;
  rvy = vb.y - va.y;

  let tangentX = rvx - (rvx * nx + rvy * ny) * nx;
  let tangentY = rvy - (rvx * nx + rvy * ny) * ny;

  let tangentLength = sqrt(tangentX * tangentX + tangentY * tangentY);

  if (tangentLength > 0.0001) {
    tangentX /= tangentLength;
    tangentY /= tangentLength;

    let raCrossT = cross2D(raX, raY, tangentX, tangentY);
    let rbCrossT = cross2D(rbX, rbY, tangentX, tangentY);

    let tangentInvMassSum =
      a.invMass +
      b.invMass +
      raCrossT * raCrossT * a.invInertia +
      rbCrossT * rbCrossT * b.invInertia;

    let tangentVelocity = rvx * tangentX + rvy * tangentY;

    let tangentImpulseMag = -tangentVelocity / tangentInvMassSum;

    let maxFrictionImpulse = normalImpulseMag * FRICTION;

    tangentImpulseMag = constrain(
      tangentImpulseMag,
      -maxFrictionImpulse,
      maxFrictionImpulse,
    );

    let frictionImpulseX = tangentImpulseMag * tangentX;
    let frictionImpulseY = tangentImpulseMag * tangentY;

    a.applyImpulse(-frictionImpulseX, -frictionImpulseY, contactX, contactY);
    b.applyImpulse(frictionImpulseX, frictionImpulseY, contactX, contactY);
  }
}

function tryFracture(body, impactEnergy, contactX, contactY, normalX, normalY) {
  if (impactEnergy < body.minFractureImpactEnergy) {
    return;
  }
  if (body.fractureCooldown > 0) {
    return;
  }

  if (body.radius <= MIN_REMAINING_BODY_RADIUS) {
    return;
  }

  if (fracturesThisFrame >= MAX_FRACTURES_PER_FRAME) {
    return;
  }

  if (bodies.length + pendingFragments.length >= MAX_BODIES) {
    return;
  }

  let localFracture = getLocalFractureFromImpact(body, impactEnergy);

  if (localFracture === null) {
    return;
  }

  let originalX = body.x;
  let originalY = body.y;
  let originalRadius = body.radius;
  let originalMass = body.mass;

  let removedMass = localFracture.removedMass;
  let desiredVisibleFragmentMass = localFracture.visibleFragmentMass;

  let remainingMass = originalMass - removedMass;
  let remainingRadius = massToRadius(remainingMass);

  let hitDx = shortestDeltaAxis(originalX, contactX, CANVAS_WIDTH);
  let hitDy = shortestDeltaAxis(originalY, contactY, CANVAS_HEIGHT);
  let hitAngle = atan2(hitDy, hitDx);

  let centerShift = originalRadius - remainingRadius;
  let newBodyX = originalX - cos(hitAngle) * centerShift;
  let newBodyY = originalY - sin(hitAngle) * centerShift;

  let padding = 1;

  let baseFractureCount = getFractureCountFromRadius(originalRadius);

  // Low-energy chips should usually start with fewer fragments.
  // High-energy impacts can start with more.
  let energyFragmentBoost = floor(
    lerp(0, MAX_FRAGMENTS, localFracture.localDamage),
  );

  baseFractureCount = constrain(
    baseFractureCount + energyFragmentBoost,
    MIN_FRAGMENTS,
    MAX_FRAGMENTS,
  );

  let bestResult = null;

  for (
    let count = baseFractureCount;
    count <= MAX_FRACTURE_SEARCH_COUNT;
    count++
  ) {
    let layout = buildVariableFragmentLayout(
      originalX,
      originalY,
      originalRadius,
      newBodyX,
      newBodyY,
      remainingRadius,
      desiredVisibleFragmentMass,
      count,
      hitAngle,
      contactX,
      contactY,
      padding,
    );

    if (layout !== null) {
      bestResult = layout;
      break;
    }
  }

  if (bestResult === null) {
    for (
      let count = baseFractureCount;
      count <= MAX_FRACTURE_SEARCH_COUNT;
      count++
    ) {
      for (let scale = 0.95; scale >= 0.1; scale -= 0.05) {
        let testVisibleMass = desiredVisibleFragmentMass * scale;

        let layout = buildVariableFragmentLayout(
          originalX,
          originalY,
          originalRadius,
          newBodyX,
          newBodyY,
          remainingRadius,
          testVisibleMass,
          count,
          hitAngle,
          contactX,
          contactY,
          padding,
        );

        if (layout !== null) {
          bestResult = layout;
          break;
        }
      }

      if (bestResult !== null) {
        break;
      }
    }
  }

  if (bestResult === null) {
    return;
  }

  let createdFragments = [];
  let placedFragmentMass = 0;

  for (let i = 0; i < bestResult.fragments.length; i++) {
    let data = bestResult.fragments[i];

    let angle = atan2(data.y - originalY, data.x - originalX);

    let tangentX = -sin(angle);
    let tangentY = cos(angle);

    let contactVelocity = body.getVelocityAtPoint(contactX, contactY);

    let baseBurstSpeed = random(20, 80);
    let baseTangentSpeed = random(-40, 40);

    let fragmentXVel =
      contactVelocity.x +
      cos(angle) * baseBurstSpeed +
      tangentX * baseTangentSpeed;

    let fragmentYVel =
      contactVelocity.y +
      sin(angle) * baseBurstSpeed +
      tangentY * baseTangentSpeed;

    let fragment = new GravityBody(
      data.x,
      data.y,
      data.radius,
      fragmentXVel,
      fragmentYVel,
    );

    fragment.r = body.r;
    fragment.g = body.g;
    fragment.b = body.b;

    fragment.angularVel = body.angularVel + random(-3, 3);
    fragment.fractureCooldown = 0.25;

    fragment.fractureDirX = cos(angle);
    fragment.fractureDirY = sin(angle);
    fragment.fractureTangentX = tangentX;
    fragment.fractureTangentY = tangentY;

    createdFragments.push(fragment);
    placedFragmentMass += data.mass;
  }

  if (placedFragmentMass <= 0 || createdFragments.length <= 0) {
    return;
  }

  // This is the removed mass that did not become visible fragments.
  let extraRemovedMass = max(0, removedMass - placedFragmentMass);

  // Lost mass becomes heat instead of extra velocity/spin.
  let fractureHeat = extraRemovedMass * LOST_MASS_TO_HEAT;

  let originalHeat = fractureHeat * FRACTURE_HEAT_TO_ORIGINAL;
  let fragmentHeat = fractureHeat * FRACTURE_HEAT_TO_FRAGMENTS;

  body.heatEnergy += originalHeat;

  let heatPerFragment = fragmentHeat / createdFragments.length;

  for (let i = 0; i < createdFragments.length; i++) {
    let fragment = createdFragments[i];

    fragment.heatEnergy += heatPerFragment;

    delete fragment.fractureDirX;
    delete fragment.fractureDirY;
    delete fragment.fractureTangentX;
    delete fragment.fractureTangentY;

    if (bodies.length + pendingFragments.length >= MAX_BODIES) {
      break;
    }

    pendingFragments.push(fragment);
  }

  fracturesThisFrame++;

  body.mass = remainingMass;
  body.radius = remainingRadius;

  body.x = newBodyX;
  body.y = newBodyY;

  body.refreshPhysicsValues();

  body.fractureCooldown = 0.15;

  // Recoil on original body.
  let recoilStrength = removedMass / body.mass;

  body.xVel -= normalX * recoilStrength * 20;
  body.yVel -= normalY * recoilStrength * 20;

  let rx = contactX - body.x;
  let ry = contactY - body.y;

  let recoilImpulseX = -normalX * removedMass * 0.02;
  let recoilImpulseY = -normalY * removedMass * 0.02;

  body.angularVel +=
    cross2D(rx, ry, recoilImpulseX, recoilImpulseY) * body.invInertia;
}

function buildVariableFragmentLayout(
  originalX,
  originalY,
  originalRadius,
  newBodyX,
  newBodyY,
  remainingRadius,
  visibleFragmentMass,
  fragmentCount,
  hitAngle,
  contactX,
  contactY,
  padding,
) {
  let fragmentSpecs = createExponentialFragmentSpecs(
    visibleFragmentMass,
    fragmentCount,
  );

  if (fragmentSpecs.length <= 0) {
    return null;
  }

  for (
    let layoutAttempt = 0;
    layoutAttempt < VARIABLE_FRAGMENT_LAYOUT_ATTEMPTS;
    layoutAttempt++
  ) {
    let fragments = [];
    let failed = false;

    for (let i = 0; i < fragmentSpecs.length; i++) {
      let spec = fragmentSpecs[i];

      let position = findPositionForVariableFragment(
        originalX,
        originalY,
        originalRadius,
        newBodyX,
        newBodyY,
        remainingRadius,
        spec.radius,
        i,
        fragmentSpecs.length,
        hitAngle,
        contactX,
        contactY,
        fragments,
        padding,
      );

      if (position === null) {
        failed = true;
        break;
      }

      fragments.push({
        x: position.x,
        y: position.y,
        mass: spec.mass,
        radius: spec.radius,
      });
    }

    if (!failed && fragments.length === fragmentSpecs.length) {
      return {
        fragments: fragments,
        visibleMass: visibleFragmentMass,
      };
    }
  }

  return null;
}

function createExponentialFragmentSpecs(totalVisibleMass, fragmentCount) {
  let specs = [];
  let weights = [];
  let totalWeight = 0;

  for (let i = 0; i < fragmentCount; i++) {
    let distancePercent = fragmentCount === 1 ? 0 : i / (fragmentCount - 1);

    // High near impact point, low farther away.
    let energyPercent = Math.exp(-FRACTURE_SIZE_FALLOFF * distancePercent);

    // High energy = smaller fragment.
    // Low energy = larger fragment.
    let sizeWeight = lerp(
      MIN_FRAGMENT_SIZE_WEIGHT,
      MAX_FRAGMENT_SIZE_WEIGHT,
      1 - energyPercent,
    );

    sizeWeight *= random(0.85, 1.15);

    weights.push(sizeWeight);
    totalWeight += sizeWeight;
  }

  for (let i = 0; i < fragmentCount; i++) {
    let mass = totalVisibleMass * (weights[i] / totalWeight);
    let radius = massToRadius(mass);

    if (radius < MIN_FRAGMENT_RADIUS) {
      return [];
    }

    specs.push({
      mass: mass,
      radius: radius,
    });
  }

  // Important:
  // First fragment is smallest and placed closest to impact.
  // Later fragments are larger and placed farther away.
  specs.sort((a, b) => a.radius - b.radius);

  return specs;
}

function findPositionForVariableFragment(
  originalX,
  originalY,
  originalRadius,
  newBodyX,
  newBodyY,
  remainingRadius,
  fragmentRadius,
  fragmentIndex,
  fragmentCount,
  hitAngle,
  contactX,
  contactY,
  existingFragments,
  padding,
) {
  let distancePercent =
    fragmentCount === 1 ? 0 : fragmentIndex / (fragmentCount - 1);

  let angleSpread = lerp(
    NEAR_FRAGMENT_ANGLE_SPREAD,
    FAR_FRAGMENT_ANGLE_SPREAD,
    distancePercent,
  );

  for (
    let attempt = 0;
    attempt < FRAGMENT_PLACEMENT_ATTEMPTS_PER_FRAGMENT;
    attempt++
  ) {
    let angle = hitAngle + random(-angleSpread, angleSpread);

    // Near-impact fragments stay close to the outer collision point.
    // Farther/larger fragments are allowed deeper and wider inside the chipped region.
    let maxDist = originalRadius - fragmentRadius - padding;

    let shellDepth = originalRadius * lerp(0.08, 0.45, distancePercent);

    let minDist = max(0, maxDist - shellDepth);

    let dist = random(minDist, maxDist);

    let x = originalX + cos(angle) * dist;
    let y = originalY + sin(angle) * dist;

    if (
      canPlaceVariableFragment(
        x,
        y,
        fragmentRadius,
        originalX,
        originalY,
        originalRadius,
        newBodyX,
        newBodyY,
        remainingRadius,
        existingFragments,
        padding,
      )
    ) {
      return { x: x, y: y };
    }
  }

  return null;
}

function canPlaceVariableFragment(
  x,
  y,
  fragmentRadius,
  originalX,
  originalY,
  originalRadius,
  newBodyX,
  newBodyY,
  remainingRadius,
  existingFragments,
  padding,
) {
  let dxOld = x - originalX;
  let dyOld = y - originalY;
  let distOld = sqrt(dxOld * dxOld + dyOld * dyOld);

  if (distOld + fragmentRadius + padding > originalRadius) {
    return false;
  }

  let dxNew = x - newBodyX;
  let dyNew = y - newBodyY;
  let distNew = sqrt(dxNew * dxNew + dyNew * dyNew);

  if (distNew < remainingRadius + fragmentRadius + padding) {
    return false;
  }

  for (let i = 0; i < existingFragments.length; i++) {
    let other = existingFragments[i];

    let dx = x - other.x;
    let dy = y - other.y;
    let dist = sqrt(dx * dx + dy * dy);

    if (dist < fragmentRadius + other.radius + padding) {
      return false;
    }
  }

  return true;
}
function getFractureCountFromRadius(radius) {
  let radiusPercent = (radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS);
  radiusPercent = constrain(radiusPercent, 0, 1);

  // Larger radius = fewer fragments.
  return floor(lerp(MAX_FRAGMENTS, MIN_FRAGMENTS, radiusPercent));
}

function getBindingEnergy(radius, mass) {
  return MATERIAL_BINDING_STRENGTH * mass * radius;
}
function getLocalFractureFromImpact(body, impactEnergy) {
  if (impactEnergy < body.minFractureImpactEnergy) {
    return null;
  }

  let fullBindingEnergy = getBindingEnergy(body.radius, body.mass);

  if (fullBindingEnergy <= 0) {
    return null;
  }

  let normalizedImpact = impactEnergy / fullBindingEnergy;

  // Cached curve lookup instead of Math.exp per collision.
  let localDamage = sampleLocalFractureDamage(normalizedImpact);

  if (localDamage < MIN_LOCAL_DAMAGE_TO_FRACTURE) {
    return null;
  }

  let minRemainingMass = radiusToMass(MIN_REMAINING_BODY_RADIUS);
  let maxRemovableMass = body.mass - minRemainingMass;

  if (maxRemovableMass <= 0) {
    return null;
  }

  let removedMassPercent = MAX_MASS_LOSS_PERCENT * localDamage;

  let removedMass = body.mass * removedMassPercent;
  removedMass = min(removedMass, maxRemovableMass);

  let visibleFragmentMass = removedMass * FRACTURE_FRAGMENT_EFFICIENCY;

  if (visibleFragmentMass < radiusToMass(MIN_FRAGMENT_RADIUS)) {
    return null;
  }

  let transferredEnergy =
    impactEnergy * localDamage * FRACTURE_ENERGY_TRANSFER_PERCENT;

  return {
    localDamage: localDamage,
    removedMass: removedMass,
    visibleFragmentMass: visibleFragmentMass,
    transferredEnergy: transferredEnergy,
  };
}

function getMinimumFractureImpactEnergy(body) {
  let fullBindingEnergy = getBindingEnergy(body.radius, body.mass);

  if (fullBindingEnergy <= 0) {
    return Infinity;
  }

  let minVisibleFragmentMass = radiusToMass(MIN_FRAGMENT_RADIUS);

  let maxPossibleVisibleMass =
    body.mass * MAX_MASS_LOSS_PERCENT * FRACTURE_FRAGMENT_EFFICIENCY;

  if (maxPossibleVisibleMass <= 0) {
    return Infinity;
  }

  let damageFromLocalThreshold = MIN_LOCAL_DAMAGE_TO_FRACTURE;

  let damageFromVisibleFragment =
    minVisibleFragmentMass / maxPossibleVisibleMass;

  let requiredDamage = max(damageFromLocalThreshold, damageFromVisibleFragment);

  if (requiredDamage >= 1) {
    return Infinity;
  }

  let requiredNormalizedImpact =
    getSampledNormalizedImpactForDamage(requiredDamage);

  if (requiredNormalizedImpact === Infinity) {
    return Infinity;
  }

  return requiredNormalizedImpact * fullBindingEnergy;
}

const GRID_COLS = Math.ceil(CANVAS_WIDTH / SPATIAL_CELL_SIZE);
const GRID_ROWS = Math.ceil(CANVAS_HEIGHT / SPATIAL_CELL_SIZE);

function wrapCell(value, max) {
  return mod(value, max);
}

function getCellKey(cellX, cellY) {
  return cellY * GRID_COLS + cellX;
}

function radiusToMass(radius) {
  // 2D area-based mass.
  // PI is omitted because it cancels out when converting back.
  return radius * radius;
}

function massToRadius(mass) {
  return sqrt(max(0, mass));
}

function cross2D(ax, ay, bx, by) {
  return ax * by - ay * bx;
}
function mod(value, size) {
  return ((value % size) + size) % size;
}

function wrapX(x) {
  return mod(x, CANVAS_WIDTH);
}

function wrapY(y) {
  return mod(y, CANVAS_HEIGHT);
}

function shortestDeltaAxis(from, to, size) {
  return mod(to - from + size * 0.5, size) - size * 0.5;
}

function getToroidalDistanceSq(ax, ay, bx, by) {
  let dx = shortestDeltaAxis(ax, bx, CANVAS_WIDTH);
  let dy = shortestDeltaAxis(ay, by, CANVAS_HEIGHT);
  return dx * dx + dy * dy;
}

function getRadiusPercent(radius) {
  let percent = (radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS);
  return constrain(percent, 0, 1);
}

function getSmallBodyBloomIntensityBoost(radius) {
  let smallness = 1 - getRadiusPercent(radius);
  return lerp(
    LARGE_BODY_BLOOM_INTENSITY_MULT,
    SMALL_BODY_BLOOM_INTENSITY_BOOST,
    smallness,
  );
}

function getSmallBodyBloomRadiusBoost(radius) {
  let smallness = 1 - getRadiusPercent(radius);
  return lerp(
    LARGE_BODY_BLOOM_RADIUS_MULT,
    SMALL_BODY_BLOOM_RADIUS_BOOST,
    smallness,
  );
}

function getBodyVisualEnergy01(body) {
  let speedSq = body.xVel * body.xVel + body.yVel * body.yVel;

  let linearEnergy = 0.5 * body.mass * speedSq;
  let angularEnergy = 0.5 * body.inertia * body.angularVel * body.angularVel;

  let gravityNeighborEnergy =
    body.nearbyGravityInfluence * GRAVITY_NEIGHBOR_VISUAL_WEIGHT;

  let heatEnergy = body.heatEnergy * HEAT_VISUAL_WEIGHT;

  let weightedEnergy =
    linearEnergy * LINEAR_VISUAL_WEIGHT +
    angularEnergy * ANGULAR_VISUAL_WEIGHT +
    gravityNeighborEnergy +
    heatEnergy;

  let energy01 = Math.log(1 + weightedEnergy) / LOG_VISUAL_ENERGY_SCALE;

  return constrain(energy01, 0, 1);
}

class BarnesHutNode {
  constructor(x, y, w, h, depth) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.depth = depth;

    this.mass = 0;
    this.comX = 0;
    this.comY = 0;

    this.bodies = [];
    this.children = null;
  }

  insert(body) {
    this.addMass(body);

    if (this.children !== null) {
      this.getChildForBody(body).insert(body);
      return;
    }

    if (this.bodies.length === 0) {
      this.bodies.push(body);
      return;
    }

    if (
      this.depth >= BARNES_HUT_MAX_DEPTH ||
      this.w <= BARNES_HUT_MIN_NODE_SIZE ||
      this.h <= BARNES_HUT_MIN_NODE_SIZE
    ) {
      this.bodies.push(body);
      return;
    }

    let oldBodies = this.bodies;
    this.bodies = [];

    this.subdivide();

    for (let i = 0; i < oldBodies.length; i++) {
      this.getChildForBody(oldBodies[i]).insert(oldBodies[i]);
    }

    this.getChildForBody(body).insert(body);
  }

  addMass(body) {
    let px = wrapX(body.x);
    let py = wrapY(body.y);

    let newMass = this.mass + body.mass;

    if (newMass <= 0) {
      return;
    }

    this.comX = (this.comX * this.mass + px * body.mass) / newMass;
    this.comY = (this.comY * this.mass + py * body.mass) / newMass;

    this.mass = newMass;
  }

  subdivide() {
    let halfW = this.w * 0.5;
    let halfH = this.h * 0.5;

    let d = this.depth + 1;

    this.children = [
      new BarnesHutNode(this.x, this.y, halfW, halfH, d),
      new BarnesHutNode(this.x + halfW, this.y, halfW, halfH, d),
      new BarnesHutNode(this.x, this.y + halfH, halfW, halfH, d),
      new BarnesHutNode(this.x + halfW, this.y + halfH, halfW, halfH, d),
    ];
  }

  getChildForBody(body) {
    let px = wrapX(body.x);
    let py = wrapY(body.y);

    let midX = this.x + this.w * 0.5;
    let midY = this.y + this.h * 0.5;

    let right = px >= midX;
    let bottom = py >= midY;

    if (!right && !bottom) return this.children[0];
    if (right && !bottom) return this.children[1];
    if (!right && bottom) return this.children[2];

    return this.children[3];
  }

  containsPoint(px, py) {
    return (
      px >= this.x &&
      px < this.x + this.w &&
      py >= this.y &&
      py < this.y + this.h
    );
  }

  getSize() {
    return max(this.w, this.h);
  }
}

function buildGravityTree() {
  gravityTree = new BarnesHutNode(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0);

  for (let i = 0; i < bodies.length; i++) {
    gravityTree.insert(bodies[i]);
  }
}

function applyBarnesHutGravity(body, node) {
  if (node === null || node.mass <= 0) {
    return;
  }

  let px = wrapX(body.x);
  let py = wrapY(body.y);

  // If this is a terminal node, apply exact body-to-body gravity.
  if (node.children === null) {
    for (let i = 0; i < node.bodies.length; i++) {
      let other = node.bodies[i];

      if (other === body) {
        continue;
      }

      applyGravityFromMass(body, other.mass, other.x, other.y);
    }

    return;
  }

  let dx = shortestDeltaAxis(body.x, node.comX, CANVAS_WIDTH);
  let dy = shortestDeltaAxis(body.y, node.comY, CANVAS_HEIGHT);

  let distanceSq = dx * dx + dy * dy + SOFTENING;
  let distance = sqrt(distanceSq);

  let nodeSize = node.getSize();

  let nodeContainsBody = node.containsPoint(px, py);

  let canApproximate =
    !nodeContainsBody && nodeSize / distance < BARNES_HUT_THETA;

  if (canApproximate) {
    applyGravityFromMass(body, node.mass, node.comX, node.comY);

    return;
  }

  for (let i = 0; i < node.children.length; i++) {
    applyBarnesHutGravity(body, node.children[i]);
  }
}

function applyGravityFromMass(target, sourceMass, sourceX, sourceY) {
  let dx = shortestDeltaAxis(target.x, sourceX, CANVAS_WIDTH);
  let dy = shortestDeltaAxis(target.y, sourceY, CANVAS_HEIGHT);

  let rawDistanceSq = dx * dx + dy * dy;

  if (rawDistanceSq <= 0.0001) {
    return;
  }

  let distanceSq = rawDistanceSq + SOFTENING;
  let distance = sqrt(distanceSq);

  let dirX = dx / distance;
  let dirY = dy / distance;

  let accel = (GRAVITY_STRENGTH * sourceMass) / distanceSq;

  target.xAccel += dirX * accel;
  target.yAccel += dirY * accel;

  accumulateVisualGravityInfluenceFromMass(target, sourceMass, rawDistanceSq);
}

function accumulateVisualGravityInfluenceFromMass(
  target,
  sourceMass,
  rawDistanceSq,
) {
  let rangeSq = GRAVITY_NEIGHBOR_VISUAL_RANGE * GRAVITY_NEIGHBOR_VISUAL_RANGE;

  if (rawDistanceSq > rangeSq) {
    return;
  }

  let closeness = 1 - rawDistanceSq / rangeSq;
  closeness = constrain(closeness, 0, 1);

  target.nearbyGravityInfluence += closeness * sourceMass;
}

class GravityBody {
  constructor(x, y, radius, xVel, yVel) {
    if (x === undefined) {
      this.radius = random(MIN_RADIUS, MAX_RADIUS);

      this.x = random(this.radius, width - this.radius);
      this.y = random(this.radius, height - this.radius);

      this.xVel = random(MIN_VELOCITY, MAX_VELOCITY);
      this.yVel = random(MIN_VELOCITY, MAX_VELOCITY);
    } else {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.xVel = xVel;
      this.yVel = yVel;
    }

    this.angle = random(TWO_PI);
    this.angularVel = random(-1, 1);

    this.xAccel = 0;
    this.yAccel = 0;

    this.heatEnergy = 0;

    this.fractureCooldown = 0;

    this.r = random(100, 200);
    this.g = random(100, 200);
    this.b = random(100, 200);

    this.mass = radiusToMass(this.radius);

    this.refreshPhysicsValues();
    this.frozen = false;
  }

  refreshPhysicsValues() {
    this.invMass = 1 / this.mass;

    this.inertia = 0.5 * this.mass * this.radius * this.radius;
    this.invInertia = 1 / this.inertia;

    this.fractureEnergy = getBindingEnergy(this.radius, this.mass);

    this.minFractureImpactEnergy = getMinimumFractureImpactEnergy(this);

    this.bloomIntensityBoost = getSmallBodyBloomIntensityBoost(this.radius);
    this.bloomRadiusBoost = getSmallBodyBloomRadiusBoost(this.radius);
  }

  resetAcceleration() {
    this.xAccel = 0;
    this.yAccel = 0;

    // Visual-only. Reset every frame.
    this.nearbyGravityInfluence = 0;
  }

  getVelocityAtPoint(px, py) {
    let rx = shortestDeltaAxis(this.x, px, CANVAS_WIDTH);
    let ry = shortestDeltaAxis(this.y, py, CANVAS_HEIGHT);

    return {
      x: this.xVel - this.angularVel * ry,
      y: this.yVel + this.angularVel * rx,
    };
  }

  applyImpulse(impulseX, impulseY, pointX, pointY) {
    this.xVel += impulseX * this.invMass;
    this.yVel += impulseY * this.invMass;

    let rx = shortestDeltaAxis(this.x, pointX, CANVAS_WIDTH);
    let ry = shortestDeltaAxis(this.y, pointY, CANVAS_HEIGHT);

    this.angularVel += cross2D(rx, ry, impulseX, impulseY) * this.invInertia;
  }

  cacheBloomData() {
    let energy01 = getBodyVisualEnergy01(this);

    let intensity = energy01 * this.bloomIntensityBoost;
    intensity = constrain(intensity, 0, 1);

    this.bloomEnergy01 = energy01;
    this.bloomExtraRadius =
      lerp(MIN_BLOOM_EXTRA_RADIUS, MAX_BLOOM_EXTRA_RADIUS, energy01) *
      this.bloomRadiusBoost;
    this.bloomAlpha = lerp(MIN_BLOOM_ALPHA, MAX_BLOOM_ALPHA, intensity);
  }

  update(t) {
    if (this.frozen) {
      this.angle += this.angularVel * t;
      return;
    }

    this.fractureCooldown -= t;

    this.xVel += this.xAccel * t;
    this.yVel += this.yAccel * t;

    this.x += this.xVel * t;
    this.y += this.yVel * t;

    this.angle += this.angularVel * t;
    this.angularVel *= ANGULAR_DAMPING;

    this.heatEnergy *= Math.pow(HEAT_DECAY_PER_SECOND, t);

    if (this.heatEnergy < 0.001) {
      this.heatEnergy = 0;
    }
  }

  draw() {
    let px = wrapX(this.x);
    let py = wrapY(this.y);

    this.drawAt(px, py);

    let drawLeft = px - this.radius < 0;
    let drawRight = px + this.radius > CANVAS_WIDTH;
    let drawTop = py - this.radius < 0;
    let drawBottom = py + this.radius > CANVAS_HEIGHT;

    let offsetX = 0;
    let offsetY = 0;

    if (drawLeft) {
      offsetX = CANVAS_WIDTH;
      this.drawAt(px + offsetX, py);
    } else if (drawRight) {
      offsetX = -CANVAS_WIDTH;
      this.drawAt(px + offsetX, py);
    }

    if (drawTop) {
      offsetY = CANVAS_HEIGHT;
      this.drawAt(px, py + offsetY);
    } else if (drawBottom) {
      offsetY = -CANVAS_HEIGHT;
      this.drawAt(px, py + offsetY);
    }

    // Corner duplicate only when crossing both axes.
    if (offsetX !== 0 && offsetY !== 0) {
      this.drawAt(px + offsetX, py + offsetY);
    }
  }

  drawAt(drawX, drawY) {
    let shouldDrawBloom = this.bloomAlpha > 5;

    push();

    translate(drawX, drawY);
    rotate(this.angle);

    noStroke();
    if (shouldDrawBloom) {
      // Bloom first, behind the body.
      // Uses layered translucent circles instead of a real post-process bloom.
      for (let i = BLOOM_LAYERS; i >= 1; i--) {
        let layerPercent = i / BLOOM_LAYERS;

        let glowRadius = this.radius + this.bloomExtraRadius * layerPercent;

        let alpha = this.bloomAlpha * (1 - layerPercent * 0.75);

        fill(this.r, this.g, this.b, alpha);
        circle(0, 0, glowRadius * 2);
      }

      // Bright inner aura
      let innerAlpha = this.bloomAlpha * 0.85;
      fill(this.r, this.g, this.b, innerAlpha);
      circle(0, 0, this.radius * 2.25);
    }
    // Main body
    fill(this.r, this.g, this.b);
    circle(0, 0, this.radius * 2);

    // Slight hot core for energetic bodies
    if (this.bloomEnergy01 > 0.35) {
      let coreAlpha = map(this.bloomEnergy01, 0.35, 1, 0, 120);
      coreAlpha = constrain(coreAlpha, 0, 120);

      fill(this.r + 55, this.g + 55, this.b + 55, coreAlpha);
      circle(0, 0, this.radius * 0.65);
    }

    // Rotation cross
    stroke(this.r + 25, this.g + 25, this.b + 25, 200);
    strokeWeight(2);

    let crossSize = this.radius * 0.7;

    line(-crossSize, 0, crossSize, 0);
    line(0, -crossSize, 0, crossSize);

    pop();
  }
}
