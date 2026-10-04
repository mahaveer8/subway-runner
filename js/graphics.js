/* SUBWAY RUNNER - High-Fidelity 3D Procedural Assets & Models */

const Graphics = {
  SKIN_PALETTES: {
    default: { body: 0x1565c0, cap: 0xd32f2f, shirt: 0xffffff, vest: 0x0d47a1, pants: 0x1a237e, shoes: 0xd32f2f, glow: 0x00f3ff, text: "Jake (Street Runner)" },
    cyber:   { body: 0x0f172a, cap: 0x00f3ff, shirt: 0x1e293b, vest: 0x00f3ff, pants: 0x0a0f1d, shoes: 0x00f3ff, glow: 0x00f3ff, text: "Cyber Nova" },
    tricky:  { body: 0x8e24aa, cap: 0xfbc02d, shirt: 0xffeb3b, vest: 0x8e24aa, pants: 0x4a148c, shoes: 0x00c853, glow: 0xff007f, text: "Tricky (Beanie)" },
    fresh:   { body: 0x00c853, cap: 0x00b0ff, shirt: 0x29b6f6, vest: 0x00e676, pants: 0x1b5e20, shoes: 0xff6d00, glow: 0xffaa00, text: "Fresh (Boombox)" },
    gold:    { body: 0xffd700, cap: 0xffd700, shirt: 0xffea00, vest: 0xffd700, pants: 0xffb300, shoes: 0xffd700, glow: 0xffd700, text: "Golden Legend" }
  },
  BOARD_PALETTES: {
    board_blue:   { body: 0xd32f2f, trim: 0xffeb3b, glow: 0xffca28 },
    board_purple: { body: 0x2e1065, trim: 0xb026ff, glow: 0xd946ef },
    board_gold:   { body: 0x451a03, trim: 0xffd700, glow: 0xffd700 }
  },

  createCharacter(skinId) {
    skinId = skinId || 'default';
    var palette = this.SKIN_PALETTES[skinId] || this.SKIN_PALETTES.default;
    var root = new THREE.Group();
    root.name = 'playerRoot';

    var shadowGeo = new THREE.PlaneGeometry(1.0, 1.4);
    shadowGeo.rotateX(-Math.PI / 2);
    var shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
    var shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.01;
    root.add(shadow);

    var bodyGroup = new THREE.Group();
    bodyGroup.name = 'playerBodyGroup';
    root.add(bodyGroup);

    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.85, 0.4), new THREE.MeshStandardMaterial({ color: palette.shirt, roughness: 0.6 }));
    torso.position.y = 0.98; torso.castShadow = true; bodyGroup.add(torso);

    var vest = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.74, 0.42), new THREE.MeshStandardMaterial({ color: palette.vest, roughness: 0.4 }));
    vest.position.set(0, 1.0, 0); vest.castShadow = true; bodyGroup.add(vest);

    var emblemGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12);
    emblemGeo.rotateX(Math.PI / 2);
    var emblem = new THREE.Mesh(emblemGeo, new THREE.MeshBasicMaterial({ color: palette.glow }));
    emblem.position.set(0, 1.1, 0.23); bodyGroup.add(emblem);

    var head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }));
    head.position.y = 1.64; head.castShadow = true; bodyGroup.add(head);

    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.48), new THREE.MeshStandardMaterial({ color: palette.cap, roughness: 0.3 }));
    cap.position.set(0, 1.84, -0.02); bodyGroup.add(cap);

    var visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.24), new THREE.MeshStandardMaterial({ color: palette.cap, roughness: 0.3 }));
    visor.position.set(0, 1.80, -0.34); bodyGroup.add(visor);

    var eyePositions = [-0.12, 0.12];
    for (var ei = 0; ei < eyePositions.length; ei++) {
      var eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0x111111 }));
      eye.position.set(eyePositions[ei], 1.65, 0.22); bodyGroup.add(eye);
    }

    var jetpackGroup = new THREE.Group();
    jetpackGroup.position.set(0, 1.05, -0.28);
    var pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.2), new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.8 }));
    jetpackGroup.add(pack);
    var nozzleXs = [-0.14, 0.14];
    for (var ni = 0; ni < nozzleXs.length; ni++) {
      var nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.9 }));
      nozzle.position.set(nozzleXs[ni], -0.32, 0); jetpackGroup.add(nozzle);
    }
    bodyGroup.add(jetpackGroup);

    var leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.46, 1.28, 0);
    var armGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    armGeo.translate(0, -0.32, 0);
    var armMat = new THREE.MeshStandardMaterial({ color: palette.shirt });
    leftArmGroup.add(new THREE.Mesh(armGeo, armMat));
    bodyGroup.add(leftArmGroup);

    var rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.46, 1.28, 0);
    rightArmGroup.add(new THREE.Mesh(armGeo, armMat));
    bodyGroup.add(rightArmGroup);

    var leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, 0.54, 0);
    var legGeo = new THREE.BoxGeometry(0.22, 0.60, 0.22);
    legGeo.translate(0, -0.30, 0);
    var legMat = new THREE.MeshStandardMaterial({ color: palette.pants });
    leftLegGroup.add(new THREE.Mesh(legGeo, legMat));
    var shoeGeo = new THREE.BoxGeometry(0.24, 0.16, 0.36);
    shoeGeo.translate(0, -0.56, 0.06);
    var shoeMat = new THREE.MeshStandardMaterial({ color: palette.shoes });
    leftLegGroup.add(new THREE.Mesh(shoeGeo, shoeMat));
    bodyGroup.add(leftLegGroup);

    var rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, 0.54, 0);
    rightLegGroup.add(new THREE.Mesh(legGeo, legMat));
    rightLegGroup.add(new THREE.Mesh(shoeGeo, shoeMat));
    bodyGroup.add(rightLegGroup);

    root.userData = { bodyGroup: bodyGroup, leftArmGroup: leftArmGroup, rightArmGroup: rightArmGroup, leftLegGroup: leftLegGroup, rightLegGroup: rightLegGroup, shadow: shadow, jetpackGroup: jetpackGroup, skinId: skinId };
    return root;
  },

  createGuardAndDog() {
    var group = new THREE.Group();
    var guardBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.52), new THREE.MeshStandardMaterial({ color: 0x0d47a1, roughness: 0.5 }));
    guardBody.position.set(-0.4, 0.96, 0); guardBody.castShadow = true; group.add(guardBody);
    var guardHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    guardHead.position.set(-0.4, 1.7, 0); group.add(guardHead);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.56), new THREE.MeshStandardMaterial({ color: 0x0d47a1 }));
    cap.position.set(-0.4, 1.95, 0); group.add(cap);
    var dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.85), new THREE.MeshStandardMaterial({ color: 0x795548 }));
    dogBody.position.set(0.5, 0.35, 0.1); dogBody.castShadow = true; group.add(dogBody);
    var dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), new THREE.MeshStandardMaterial({ color: 0x5d4037 }));
    dogHead.position.set(0.5, 0.65, -0.3); group.add(dogHead);
    return group;
  },

  createHoverboard(boardId) {
    boardId = boardId || 'board_blue';
    var palette = this.BOARD_PALETTES[boardId] || this.BOARD_PALETTES.board_blue;
    var group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 2.2), new THREE.MeshStandardMaterial({ color: palette.body, metalness: 0.8, roughness: 0.2 })));
    var trim = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 2.26), new THREE.MeshBasicMaterial({ color: palette.trim }));
    trim.position.y = -0.01; group.add(trim);
    var thrusterZs = [-0.65, 0.65];
    for (var ti = 0; ti < thrusterZs.length; ti++) {
      var orb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), new THREE.MeshBasicMaterial({ color: palette.glow }));
      orb.position.set(0, -0.08, thrusterZs[ti]); group.add(orb);
    }
    return group;
  },

  createTrain(hasRamp, isMoving) {
    hasRamp = hasRamp || false; isMoving = isMoving || false;
    var group = new THREE.Group();
    group.userData.type = 'train';
    var width = 2.1, height = 2.6, length = 12, rampLength = 3.5;
    var bodyColors = [0xc62828, 0x1565c0, 0x2e7d32, 0xe65100, 0x6a1b9a];
    var trainColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];

    var body = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), new THREE.MeshStandardMaterial({ color: trainColor, metalness: 0.55, roughness: 0.35 }));
    body.position.y = height / 2; body.castShadow = true; body.receiveShadow = true; group.add(body);

    var roof = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.12, length), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, metalness: 0.8, roughness: 0.25 }));
    roof.position.y = height + 0.06; group.add(roof);

    var stripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.22, length), new THREE.MeshStandardMaterial({ color: 0xfdd835, roughness: 0.4 }));
    stripe.position.y = 0.5; group.add(stripe);

    var windows = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.62, length * 0.78), new THREE.MeshStandardMaterial({ color: 0x0d2035, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 }));
    windows.position.y = height * 0.64; group.add(windows);

    var lightXs = [-width * 0.34, width * 0.34];
    for (var li = 0; li < lightXs.length; li++) {
      var lGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10);
      lGeo.rotateX(Math.PI / 2);
      var light = new THREE.Mesh(lGeo, new THREE.MeshBasicMaterial({ color: 0xffffe0 }));
      light.position.set(lightXs[li], height * 0.38, length / 2 + 0.04); group.add(light);
    }

    if (isMoving) {
      var beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
      beacon.position.set(0, height + 0.24, length / 2 - 0.4); group.add(beacon);
      group.userData.beacon = beacon;
    }

    if (hasRamp) {
      var rampGeo = new THREE.BufferGeometry();
      var hw = width / 2;
      var verts = new Float32Array([
        -hw, height, 0,   hw, height, 0,   hw, 0, rampLength,
        -hw, height, 0,   hw, 0, rampLength,   -hw, 0, rampLength,
        -hw, 0, 0,   hw, 0, 0,   hw, 0, rampLength,
        -hw, 0, 0,   hw, 0, rampLength,   -hw, 0, rampLength,
        -hw, 0, 0,   -hw, 0, rampLength,   -hw, height, 0,
        hw, 0, 0,   hw, height, 0,   hw, 0, rampLength
      ]);
      rampGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      rampGeo.computeVertexNormals();
      var ramp = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ color: 0xffb300, metalness: 0.4, roughness: 0.4, side: THREE.DoubleSide }));
      ramp.position.z = length / 2;
      group.add(ramp);
    }
    return group;
  },

  createHurdle() {
    var group = new THREE.Group();
    var width = 2.2, height = 0.9;
    var postXs = [-width / 2 + 0.1, width / 2 - 0.1];
    for (var pi = 0; pi < postXs.length; pi++) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, height, 8), new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 }));
      post.position.set(postXs[pi], height / 2, 0); post.castShadow = true; group.add(post);
    }
    var bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.28, 0.14), new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.3 }));
    bar.position.y = height - 0.14; bar.castShadow = true; group.add(bar);
    for (var si = -0.8; si <= 0.8; si += 0.4) {
      var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.29, 0.15), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      stripe.position.set(si, height - 0.14, 0); group.add(stripe);
    }
    return group;
  },

  createLaserGate() {
    var group = new THREE.Group();
    var width = 2.4, height = 3.2, clearance = 1.3;
    var pillarXs = [-width / 2, width / 2];
    for (var pi2 = 0; pi2 < pillarXs.length; pi2++) {
      var pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, height, 0.22), new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 }));
      pillar.position.set(pillarXs[pi2], height / 2, 0); pillar.castShadow = true; group.add(pillar);
    }
    var beamH = height - clearance;
    var beam = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, beamH, 0.25), new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.3 }));
    beam.position.y = clearance + beamH / 2; beam.castShadow = true; group.add(beam);
    for (var si2 = -0.9; si2 <= 0.9; si2 += 0.45) {
      var s = new THREE.Mesh(new THREE.BoxGeometry(0.2, beamH + 0.02, 0.27), new THREE.MeshStandardMaterial({ color: 0x212121 }));
      s.position.set(si2, clearance + beamH / 2, 0); group.add(s);
    }
    return group;
  },

  createCoin() {
    var group = new THREE.Group();
    var coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14);
    coinGeo.rotateX(Math.PI / 2);
    var coin = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.95, roughness: 0.12, emissive: 0xffaa00, emissiveIntensity: 0.5 }));
    coin.position.y = 0.75; group.add(coin);
    var star = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    star.position.y = 0.75; group.add(star);
    return group;
  },

  createPowerup(type) {
    type = type || 'magnet';
    var group = new THREE.Group();
    var ringColors = { magnet: 0xd32f2f, boost: 0x0288d1, slow: 0x7b1fa2, multiplier: 0xfbc02d, sneakers: 0x00c853 };
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 10, 22), new THREE.MeshBasicMaterial({ color: ringColors[type] || 0xd32f2f }));
    ring.position.y = 0.9; group.add(ring);
    var iconGeo;
    if (type === 'magnet') iconGeo = new THREE.TorusGeometry(0.22, 0.08, 8, 16);
    else if (type === 'boost') iconGeo = new THREE.ConeGeometry(0.22, 0.48, 8);
    else if (type === 'slow') iconGeo = new THREE.OctahedronGeometry(0.26);
    else if (type === 'sneakers') iconGeo = new THREE.BoxGeometry(0.38, 0.2, 0.32);
    else iconGeo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    var icon = new THREE.Mesh(iconGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 }));
    icon.position.y = 0.9; group.add(icon);
    return group;
  },

  createCityBuilding(buildingHeight, side) {
    buildingHeight = buildingHeight || 18; side = side || 0;
    var group = new THREE.Group();
    var bw = 7, bd = 10;
    var colors = [0x8d6e63, 0x546e7a, 0x78909c, 0x795548, 0x607d8b];
    var col = colors[Math.floor(Math.random() * colors.length)];
    var building = new THREE.Mesh(new THREE.BoxGeometry(bw, buildingHeight, bd), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }));
    building.position.y = buildingHeight / 2; building.castShadow = true; building.receiveShadow = true; group.add(building);
    var faceX = side === 0 ? bw / 2 : -bw / 2;
    var facing = side === 0 ? 1 : -1;
    for (var wy = 1; wy < buildingHeight - 1; wy += 2.2) {
      for (var wz = -bd / 2 + 1; wz < bd / 2; wz += 2.2) {
        var win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0xffee88 : 0x223355, side: THREE.FrontSide }));
        win.position.set(faceX + facing * 0.05, wy + 0.5, wz);
        win.rotation.y = facing * Math.PI / 2;
        group.add(win);
      }
    }
    var gantry = new THREE.Mesh(new THREE.BoxGeometry(bw + 6, 0.28, 0.35), new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 }));
    gantry.position.set(0, 6, 0); group.add(gantry);
    var sigLight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00e676 }));
    sigLight.position.set(-1.5, 5.7, 0); group.add(sigLight);
    return group;
  },

  createPlatformWall(length, side) {
    length = length || 40; side = side || 'left';
    var group = new THREE.Group();
    var sign = side === 'left' ? -1 : 1;
    var wall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.5, length), new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.85 }));
    wall.position.set(sign * 5.8, 1.75, 0); wall.receiveShadow = true; group.add(wall);
    var platform = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, length), new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 0.8 }));
    platform.position.set(sign * 5.3, 0.125, 0); platform.receiveShadow = true; group.add(platform);
    var edgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.27, length), new THREE.MeshBasicMaterial({ color: 0xfdd835 }));
    edgeLine.position.set(sign * 4.55, 0.135, 0); group.add(edgeLine);
    for (var cz = -length / 2 + 4; cz < length / 2; cz += 8) {
      var col2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.0, 0.3), new THREE.MeshStandardMaterial({ color: 0x616161, metalness: 0.6 }));
      col2.position.set(sign * 5.8, 2.0, cz); col2.castShadow = true; group.add(col2);
    }
    return group;
  },

  createTrackSegment(length) {
    length = length || 40;
    var group = new THREE.Group();

    // Ground plane — centered at (0, 0, -length/2)
    var road = new THREE.Mesh(new THREE.PlaneGeometry(10, length), new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -length / 2);
    road.receiveShadow = true; group.add(road);

    // Side fills
    var sideFillXs = [-1, 1];
    for (var sfi = 0; sfi < sideFillXs.length; sfi++) {
      var fill = new THREE.Mesh(new THREE.PlaneGeometry(4, length), new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.9 }));
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(sideFillXs[sfi] * 7, -0.005, -length / 2);
      fill.receiveShadow = true; group.add(fill);
    }

    // Sleepers
    var sleeperCount = Math.ceil(length / 2);
    for (var i = 0; i < sleeperCount; i++) {
      var sleeper = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.07, 0.38), new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 }));
      sleeper.position.set(0, 0.035, -(i * 2 + 0.5));
      sleeper.receiveShadow = true; group.add(sleeper);
    }

    // Rails
    var laneXs = [-2.4, 0.0, 2.4];
    for (var li2 = 0; li2 < laneXs.length; li2++) {
      var railOffsets = [-0.68, 0.68];
      for (var ri = 0; ri < railOffsets.length; ri++) {
        var railX = laneXs[li2] + railOffsets[ri];
        var rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, length), new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.95, roughness: 0.2 }));
        rail.position.set(railX, 0.10, -length / 2);
        rail.receiveShadow = true; group.add(rail);
      }
    }

    // Lane lines
    var lineXs = [-1.2, 1.2];
    for (var lli = 0; lli < lineXs.length; lli++) {
      var line = new THREE.Mesh(new THREE.PlaneGeometry(0.08, length), new THREE.MeshBasicMaterial({ color: 0xffca28 }));
      line.rotation.x = -Math.PI / 2;
      line.position.set(lineXs[lli], 0.08, -length / 2);
      group.add(line);
    }

    // Curbs
    var curbXs = [-4.55, 4.55];
    for (var ci = 0; ci < curbXs.length; ci++) {
      var curb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, length), new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.85 }));
      curb.position.set(curbXs[ci], 0.175, -length / 2);
      curb.receiveShadow = true; group.add(curb);
    }

    return group;
  },

  createOverheadStructure() {
    var group = new THREE.Group();
    var beam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x455a64, metalness: 0.7 }));
    beam.position.y = 5.5; group.add(beam);
    var supportXs = [-5.8, 5.8];
    for (var si3 = 0; si3 < supportXs.length; si3++) {
      var support = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.7 }));
      support.position.set(supportXs[si3], 2.75, 0); group.add(support);
    }
    return group;
  }
};
