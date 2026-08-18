const products = [
  {
    "id": 1,
    "name": "Aero-75 Mech Keyboard",
    "price": 189,
    "rating": 4.9,
    "reviews": 142,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Premium mechanical keyboard with customizable ice-blue backlighting.",
    "description": "The Aero-75 sets a new standard for enthusiasts. Encased in a solid CNC-milled white aluminum body, it features custom pre-lubed linear switches and double-shot PBT keycaps. The striking ice-blue backlighting reflects off a clear polycarbonate plate, providing a smooth and satisfying acoustic signature with breathtaking visual style.",
    "specs": {
      "Form Factor": "75% compact layout (82 keys)",
      "Switches": "Aero-Ice Linear switches, 45g actuation",
      "Keycaps": "Double-shot PBT cherry profile (Blue & White legends)",
      "Backlighting": "Per-key ice-blue LEDs with 16 dynamic modes",
      "Connectivity": "USB-C, Bluetooth 5.2, or 2.4Ghz wireless",
      "Hot-swap Support": "Yes, 3-pin & 5-pin compatible"
    }
  },
  {
    "id": 2,
    "name": "Aero-60 Tactile Edition",
    "price": 159,
    "rating": 4.8,
    "reviews": 87,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Compact 60% mechanical keyboard with tactile blue switches.",
    "description": "Built for speed and feedback, the Aero-60 delivers a distinct tactile bump upon actuation. The ultra-compact 60% layout maximizes desk space for mouse movement. Kept in a pristine matte-white shell with ice-blue legends, it is the ultimate typing tool for code editors and gamers alike.",
    "specs": {
      "Form Factor": "60% ultra-compact layout",
      "Switches": "Aero-Cobalt Tactile switches, 55g actuation",
      "Keycaps": "PBT double-shot profile",
      "Backlighting": "Ice-Blue solid and reactive layouts",
      "Connectivity": "Detachable braided USB-C cable",
      "Hot-swap Support": "Yes, hot-swappable socket plate"
    }
  },
  {
    "id": 3,
    "name": "Aero-Split Ergonomic",
    "price": 219,
    "rating": 4.7,
    "reviews": 56,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Split ergonomic mechanical keyboard for strain-free typing.",
    "description": "The Aero-Split separates typing halves to support natural wrist angles, reducing fatigue. Both sections feature dedicated ice-blue underglow. Fully programmable layers allow you to bind custom macros easily, wrapped in a premium blue anodized frame.",
    "specs": {
      "Form Factor": "Ergonomic split columns (68 keys)",
      "Switches": "Pre-lubed silent tactile switches",
      "Keycaps": "OEM profile PBT caps",
      "Backlighting": "Ice-blue underglow & legends",
      "Connectivity": "Split link cable, wireless USB receiver",
      "Hot-swap Support": "Yes"
    }
  },
  {
    "id": 4,
    "name": "Aero-100 Full Layout",
    "price": 209,
    "rating": 4.9,
    "reviews": 114,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Full-sized enthusiast mechanical keyboard with numeric pad.",
    "description": "No compromises. The Aero-100 includes a full numeric keypad, navigation clusters, and a custom rotary encoder knob finished in metallic blue. Integrated sound-dampening foam cushions every keypress for an incredibly quiet, solid typing bounce.",
    "specs": {
      "Form Factor": "100% full-sized layout (108 keys)",
      "Switches": "Custom quiet linear switches",
      "Keycaps": "Dye-sublimated thick PBT caps",
      "Encoder Knob": "Anodized blue rotary scroll dial",
      "Backlighting": "Ice-blue edge diffusion & keys",
      "Connectivity": "USB-C wired, Bluetooth 5.1 link"
    }
  },
  {
    "id": 5,
    "name": "Aero-Pad Numpad Pro",
    "price": 69,
    "rating": 4.8,
    "reviews": 43,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Stand-alone mechanical numeric pad with custom dial.",
    "description": "An elegant numeric keypad to match your compact setups. Sports 17 standard keys plus a programmable metallic volume slider. Features matching white case styling and ice-blue backlit animations.",
    "specs": {
      "Keys Count": "17 mechanical keys + 1 dial",
      "Switches": "Aero-Ice Linear switches",
      "Keycaps": "PBT double-shot legends",
      "Backlighting": "Single ice-blue LED strip",
      "Connectivity": "USB-C rechargeable wireless"
    }
  },
  {
    "id": 6,
    "name": "Apex Keycap Set (Blue/White)",
    "price": 49,
    "rating": 4.9,
    "reviews": 210,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Cherry profile double-shot PBT keycaps with accent keycaps.",
    "description": "Upgrade any keyboard. This custom keycap set combines pure white alphas with deep royal blue modifier keycaps and ice-blue novelty keys. Made of thick, texture-rich PBT plastic, they will never fade or shine over time.",
    "specs": {
      "Total Keys": "132 keycaps (full compatibility)",
      "Material": "Double-shot PBT (1.4mm thickness)",
      "Profile": "Cherry profile ergonomic design",
      "Legends": "Non-shine-through custom fonts",
      "Compatibility": "Fits ANSI/ISO layouts, MX style stems"
    }
  },
  {
    "id": 7,
    "name": "Aero-Barebone Custom Kit",
    "price": 119,
    "rating": 4.6,
    "reviews": 32,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Customize your own build. Barebone keyboard kit.",
    "description": "A complete custom base. Includes CNC aluminum white case, pre-installed stabilizers, brass plate, and a hot-swappable PCB supporting ice-blue per-key programming. Just plug in your choice of switches and keycaps.",
    "specs": {
      "Form Factor": "65% form factor layout",
      "PCB Sockets": "5-pin hot-swap, south-facing",
      "Plate": "Satin-finished brass plate",
      "Stabilizers": "Screw-in stabilizers (pre-lubed)",
      "Connectivity": "USB-C interface only"
    }
  },
  {
    "id": 8,
    "name": "Silent-Ice Mechanical Switches",
    "price": 35,
    "rating": 4.7,
    "reviews": 67,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Pack of 35 silent linear switches for custom builds.",
    "description": "Enjoy mechanical feel with absolute silence. These linear switches implement internal dampening pads on the stem slider, resulting in a muted return sound. Translucent ice-blue housings allow keyboard backlights to shine clearly.",
    "specs": {
      "Type": "Silent linear switches",
      "Quantity": "35 switches per pack",
      "Actuation Force": "40g actuation, 55g bottom out",
      "Housing": "Polycarbonate transparent blue top, nylon white base",
      "Stem": "Self-lubricating POM stem"
    }
  },
  {
    "id": 9,
    "name": "Aero-Coiled Cable (Sky Blue)",
    "price": 29,
    "rating": 4.8,
    "reviews": 128,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Braided coiled USB-C cable with aviator connector.",
    "description": "Clean up your desktop connections. Features a heavy-gauge coiled section wrapped in sky blue tech-flex sleeving over a white inner wire, anchored by a solid metallic detachable aviator connector port.",
    "specs": {
      "Length": "1.8 meters total extended length",
      "Connector": "5-pin GX16 metal aviator detachable",
      "Cable Type": "Double-sleeved paracord + PET techflex",
      "Port Interface": "USB-A to USB-C (gold-plated)"
    }
  },
  {
    "id": 10,
    "name": "Aero-Macropad Custom Pro",
    "price": 89,
    "rating": 4.9,
    "reviews": 49,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "9-key programmable macro pad with dual rotary encoders.",
    "description": "The ultimate shortcut deck. Fully programmable via QMK/VIA tools. Built with a solid white acrylic case, 9 custom linear mechanical keys, and dual cobalt-blue encoders to scrub timelines, scroll pages, or adjust volume.",
    "specs": {
      "Keys Count": "9 hot-swap mechanical keys",
      "Encoders": "2 rotary knob encoders with detents",
      "Software": "QMK/VIA compatible layers",
      "Frame": "Frosted white acrylic with ice-blue backglow"
    }
  },
  {
    "id": 11,
    "name": "Aero-Linear Switch Lubricant Kit",
    "price": 24,
    "rating": 4.5,
    "reviews": 38,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Enthusiast lubrication kit for mechanical switches.",
    "description": "Achieve the smoothest keypresses. Contains high-grade Krytox switch lube, stem pick-up claw, switch opener clamp, and a fine-tipped detailing brush to lube stems, springs, and stabilizers.",
    "specs": {
      "Lubricant": "Krytox GPL 205g0 (5g container)",
      "Tools Included": "Stem claw, switch opener, brush, keycap puller",
      "Opener Type": "Dual-socket MX & Box switch opener",
      "Container": "Air-tight glass container"
    }
  },
  {
    "id": 12,
    "name": "Aero-75 Acrylic Frost",
    "price": 179,
    "rating": 4.8,
    "reviews": 62,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Mechanical keyboard in frosted acrylic case with RGB glow.",
    "description": "For maximum light dispersion. Features a frosted white acrylic sandwich case that glows completely in dynamic blue tones. Under the hood are pre-lubed linear switches and thick PBT keycaps.",
    "specs": {
      "Form Factor": "75% compact (82 keys)",
      "Case": "Frosted acrylic layers CNC design",
      "Switches": "Pre-lubed linear switches",
      "Backlighting": "PCB underglow + per-key LEDs (Ice-Blue settings)",
      "Connectivity": "Detachable USB-C"
    }
  },
  {
    "id": 13,
    "name": "Aero-Pod Studio Pro",
    "price": 249,
    "rating": 4.8,
    "reviews": 98,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "High-fidelity over-ear headphones with royal blue fabric earcups.",
    "description": "Engineered for creators and audiophiles, the Aero-Pod Studio Pro delivers pristine studio-grade acoustics. Combining a lightweight matte white chassis with premium royal-blue mesh ear pads, it offers long-lasting ergonomic comfort. The 40mm custom titanium-diaphragm drivers produce deep, tight bass and sparkly highs.",
    "specs": {
      "Driver Size": "40mm custom titanium drivers",
      "Frequency Response": "10Hz - 28kHz",
      "Impedance": "32 Ohms",
      "Earcup Fabric": "Breathable sports-mesh memory foam",
      "Connection": "3.5mm coiled cable, 6.35mm adapter, or low-latency Bluetooth",
      "Weight": "260 grams"
    }
  },
  {
    "id": 14,
    "name": "Apex Desktop DAC Amp",
    "price": 135,
    "rating": 4.9,
    "reviews": 79,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "Premium desktop audio converter with glowing blue dial indicator.",
    "description": "Elevate your audio setup. The Apex DAC decodes ultra-high-resolution files with zero distortion. Built into a gorgeous sandblasted white aluminum frame, it features a heavy volume dial highlighted by a subtle glowing blue LED ring that changes intensity with output level. Perfect for high-impedance headphones.",
    "specs": {
      "DAC Chip": "ESS Sabre ES9038Q2M",
      "Resolution": "Up to 32-bit / 384kHz PCM, DSD256 native",
      "Output Ports": "3.5mm unbalanced, 4.4mm balanced, RCA line-out",
      "Input Ports": "USB-C, Coaxial, Optical",
      "Chassis Material": "Sandblasted white anodized aluminum"
    }
  },
  {
    "id": 15,
    "name": "Aero-Buds Wireless IEMs",
    "price": 89,
    "rating": 4.7,
    "reviews": 142,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "True wireless in-ear monitors with ice-blue charging case.",
    "description": "Active noise cancellation inside a ultra-compact shell. Combining pristine white earbuds with a translucent ice-blue protective charging case, these wireless buds deliver rich sound profiles with up to 30 hours of battery life.",
    "specs": {
      "ANC Performance": "Up to -35dB hybrid noise cancellation",
      "Drivers": "10mm dynamic composite driver",
      "Battery Life": "6h buds + 24h with case",
      "Water Resistance": "IPX4 splash-proof",
      "Bluetooth Link": "Bluetooth 5.3 low-latency"
    }
  },
  {
    "id": 16,
    "name": "Aero-Bar Monitor Soundbar",
    "price": 119,
    "rating": 4.6,
    "reviews": 84,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Minimalist desktop soundbar with custom blue led lighting.",
    "description": "A compact desktop soundbar designed to sit under your monitor. Delivers dual-channel stereo output with passive bass radiators, housed in a matte white metallic grille and detailed with an adjustable blue backlighting strip.",
    "specs": {
      "Output Power": "20W total system power",
      "Drivers": "2x full-range drivers + 2x passive radiators",
      "Inputs": "USB Audio, 3.5mm AUX, Bluetooth 5.0",
      "Dimensions": "42cm L x 6.5cm H x 6cm D",
      "Lighting": "Solid or breathing blue light strips"
    }
  },
  {
    "id": 17,
    "name": "Aero-Mic Studio Streamer",
    "price": 125,
    "rating": 4.8,
    "reviews": 112,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "High-definition USB condenser microphone with blue glow.",
    "description": "Broadcast-quality voice capture. This heavy-duty condenser microphone mounts on a custom shock-resistant desktop stand. Features a quick-mute tap sensor at the top that turns the internal ice-blue glow on and off.",
    "specs": {
      "Polar Patterns": "Cardioid and Omnidirectional",
      "Capsules": "Dual 14mm condenser capsules",
      "Sample Rate": "24-bit / 96kHz recording",
      "Monitoring": "3.5mm zero-latency headphone port",
      "Connection": "USB-C to USB-A (white braided cable)"
    }
  },
  {
    "id": 18,
    "name": "Aero-Shock Mic Boom Arm",
    "price": 59,
    "rating": 4.7,
    "reviews": 64,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "Spring-tension microphone boom arm with internal cable channels.",
    "description": "Maintain a clean streaming station. Professional spring-tensioned boom arm in clean matte-white, featuring internal channels to route cables cleanly and double joint brackets finished in cobalt-blue accents.",
    "specs": {
      "Max Reach": "95cm horizontal and vertical reach",
      "Weight Capacity": "Up to 1.2kg support",
      "Mount": "Heavy-duty desk clamp (grommet option included)",
      "Threading": "Standard 5/8\" & 3/8\" attachments"
    }
  },
  {
    "id": 19,
    "name": "Aero-IEM Custom Wired",
    "price": 99,
    "rating": 4.9,
    "reviews": 95,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Wired dual-driver in-ear monitors with transparent housings.",
    "description": "Detailed staging for stage and desk monitors. Encased in beautiful transparent blue shells revealing the dual-armature balance drivers. Connects with an oxygen-free silver-plated white braided cable.",
    "specs": {
      "Acoustic Design": "1 Dynamic + 1 Balanced Armature drivers",
      "Cable Type": "0.78mm 2-pin detachable silver-plated copper",
      "Sensitivity": "108dB/mW",
      "Ear Tips": "6 pairs of silicone & memory foam tips included"
    }
  },
  {
    "id": 20,
    "name": "Aero-Link Audio Interface",
    "price": 149,
    "rating": 4.8,
    "reviews": 52,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "USB XLR audio interface with preamps and direct monitor switch.",
    "description": "Plug in professional microphones. This single-channel XLR interface is built in a robust white aluminum enclosure with blue rotary indicator dials and features studio-grade microphone preamps.",
    "specs": {
      "Preamps Range": "Up to +60dB clean gain amplification",
      "Inputs": "XLR / 1/4\" TS Combo jack",
      "Outputs": "2x 1/4\" balanced TRS line outputs, 1/4\" headphone out",
      "Phantom Power": "+48V switchable for condenser mics"
    }
  },
  {
    "id": 21,
    "name": "Apex Monitor Speakers",
    "price": 299,
    "rating": 4.9,
    "reviews": 73,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Pair of active desktop monitor speakers in white cabinets.",
    "description": "Studio monitors that double as visual design statements. These custom-tuned active shelf speakers feature matte white MDF cabinets and blue Kevlar woofer cones, generating punchy stereo soundscapes.",
    "specs": {
      "Output Power": "80W RMS (40W per speaker)",
      "Woofer Cone": "4-inch blue Kevlar cones",
      "Tweeter Dome": "1-inch natural silk dome tweeters",
      "Inputs": "RCA, TRS balanced, Bluetooth 5.0 aptX HD",
      "Frequency Response": "55Hz - 20kHz"
    }
  },
  {
    "id": 22,
    "name": "Aero-Stand Headphone Hanger",
    "price": 35,
    "rating": 4.7,
    "reviews": 104,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Steel headphone desk stand with wood hanger pad.",
    "description": "Store your headphones elegantly. Features a solid heavy white iron base, curved blue anodized neck, and a soft walnut wood cradle wrapped in sky blue leather padding.",
    "specs": {
      "Cradle Material": "Premium walnut wood + leather lining",
      "Base Weight": "350g steel weighting (anti-tip)",
      "Stem Height": "28cm clearance height",
      "Base Padding": "Anti-slip foam padding"
    }
  },
  {
    "id": 23,
    "name": "Blue-Link Balanced Cable",
    "price": 19,
    "rating": 4.8,
    "reviews": 61,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "Silver-plated 4.4mm balanced audio interconnect cable.",
    "description": "High-end interconnect for DACs and balanced audio gear. Sleeved in durable double-braided sky blue nylon with gold-plated low-distortion audio jacks.",
    "specs": {
      "Cable Length": "0.5 meters connection patch",
      "Wire Gauge": "24 AWG oxygen-free copper cores",
      "Connector": "4.4mm balanced TRRRS male-to-male",
      "Shielding": "Double-shielded foil + copper weave"
    }
  },
  {
    "id": 24,
    "name": "Aero-Ear Pads Set",
    "price": 25,
    "rating": 4.6,
    "reviews": 41,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Replacement ear cushions in cooling royal blue fabric.",
    "description": "Upgrade the comfort of your headphones. These universal memory foam ear pads are covered in cooling ice-mesh royal blue fabric, which dissipates heat and channels bass frequencies cleanly.",
    "specs": {
      "Internal Core": "Slow-rebound high-density memory foam",
      "External Fabric": "Sweat-wicking ice-cool sport mesh",
      "Inner Ring Dimensions": "65mm x 45mm oval layout",
      "Compatibility": "Fits standard over-ear ring mounting structures"
    }
  },
  {
    "id": 25,
    "name": "Apex Portable Headphone Amp",
    "price": 119,
    "rating": 4.8,
    "reviews": 58,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "Portable battery-powered headphone DAC/Amp.",
    "description": "Enjoy pristine sound wherever you travel. Features a rechargeable lithium battery and fits inside a pocket. Encased in a beautiful white alloy frame with custom blue status indicators.",
    "specs": {
      "Output Power": "240mW @ 32 Ohms balanced",
      "Battery Life": "Up to 10 hours continuous playback",
      "DAC Chipset": "Dual CS43131 decoding engines",
      "Connectivity": "USB-C input, 3.5mm & 4.4mm output ports"
    }
  },
  {
    "id": 26,
    "name": "Nebula Smart Desk Lamp",
    "price": 79,
    "rating": 4.7,
    "reviews": 86,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Sleek desk lamp with dynamic blue accent illumination.",
    "description": "The Nebula Smart Desk Lamp merges structural minimalism with high-end ambient light. Featuring an adjustable brushed white aluminum armature, it sports an auxiliary glowing blue stem that serves as a subtle, gorgeous mood light. Customize brightness and color temperature with touch-sensitive slide controls on the base.",
    "specs": {
      "Brightness": "Up to 800 lumens (dimmable)",
      "Color Temp": "2700K - 6500K adjustable",
      "Control": "Touch-sensitive base, smart assistant compatible",
      "Power Port": "USB-C pass-through charging (10W max)",
      "Material": "Anodized aluminum & premium ABS"
    }
  },
  {
    "id": 27,
    "name": "Aero-Bar Screen Lightbar",
    "price": 89,
    "rating": 4.8,
    "reviews": 142,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Monitor light bar with dual desk and ambient backlight glow.",
    "description": "Protect your eyes when working late. Mounts on top of your monitor to light your desk without glare. Features primary white desk lighting and a secondary rear-facing ambient light panel with selectable ice-blue glowing modes.",
    "specs": {
      "Mounting Mechanism": "Weighted clip design for flat & curved displays",
      "Task Light Colors": "Adjustable warm to cool white (3000K-6000K)",
      "Ambient Backlight": "Ice-blue color settings (breathing and solid)",
      "Control": "Wireless desktop dial controller included"
    }
  },
  {
    "id": 28,
    "name": "Aero-Orb Ambient Glow",
    "price": 45,
    "rating": 4.9,
    "reviews": 215,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Spherical ambient light with white base and ice-blue glass globe.",
    "description": "Add soft accent lighting to your desktop corner. A hand-blown frosted glass sphere sitting on a solid matte white base. Emits a soothing, uniform ice-blue glow that looks beautiful on any desk setup.",
    "specs": {
      "Glow Diameter": "12cm glass sphere",
      "Base Construction": "Nordic white ash wood frame",
      "Light Source": "Custom low-heat cobalt-blue micro-LED core",
      "Power Source": "USB-C rechargeable battery (up to 12h)"
    }
  },
  {
    "id": 29,
    "name": "Nebula LED Strip Kit",
    "price": 39,
    "rating": 4.6,
    "reviews": 121,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "5-meter smart LED strip kit with pure white and blue light.",
    "description": "Install gorgeous desk backglows and shelf accents. This smart light strip focuses specifically on generating high-fidelity warm/cool whites and various deep blue ambient light tones. Integrates easily with local smart home protocols.",
    "specs": {
      "Length": "5 meters total (cut-to-size increments)",
      "LED Density": "60 LEDs per meter (total 300 LEDs)",
      "Color Support": "Warm White, Cool White, Deep Cobalt, Sky Blue, Cyan",
      "Control APP": "Smart Life / Tuya integration compatible"
    }
  },
  {
    "id": 30,
    "name": "Aero-Beacon Status Light",
    "price": 49,
    "rating": 4.7,
    "reviews": 58,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Mini USB signal status tower indicator light.",
    "description": "A fun indicator to show if you are busy, code compiling, or in focus. Configured in a sleek white plastic cylinder with customizable blue notification pulses and animations that sync to computer scripts.",
    "specs": {
      "Height": "14cm desk beacon tower",
      "Sync Software": "Open-source USB serial controller client",
      "LED Ring": "16 individually addressable blue LEDs",
      "Connection": "Micro-USB input port"
    }
  },
  {
    "id": 31,
    "name": "Aero-Spot Desktop Spotlight",
    "price": 65,
    "rating": 4.8,
    "reviews": 74,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Adjustable desk spot projector in anodized white housing.",
    "description": "Cast dramatic highlighting on your keyboard or custom keyboards shelf. Sleek adjustable spot projector casing in white, projecting a narrow spotlight beam in pure ice-blue light colors.",
    "specs": {
      "Beam Angle": "Narrow 15-degree spotlight lens",
      "Adjustment": "360-degree rotation, 180-degree tilt yoke bracket",
      "Material": "Anodized aluminum structure",
      "Cable Switch": "Inline dimming rocker switch"
    }
  },
  {
    "id": 32,
    "name": "Apex Sound-Reactive Column",
    "price": 99,
    "rating": 4.9,
    "reviews": 88,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Pair of tall sound-reactive light towers in white finishes.",
    "description": "Sync your workspace lights to audio levels. Tall floor/desk columns containing high-speed mic sensors that animate soundwaves in ice-blue and white light beams in real time.",
    "specs": {
      "Towers Quantity": "Pair of two 45cm columns",
      "Dynamic Mode": "32 level audio frequency visualizations",
      "Colors Selection": "8 solid blue/white themes, 4 animated modes",
      "Sensitivity": "Adjustable ambient mic gains"
    }
  },
  {
    "id": 33,
    "name": "Aero-Neon Flex Tube",
    "price": 34,
    "rating": 4.7,
    "reviews": 93,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Flexible silicon neon LED tube mapping blue lines.",
    "description": "Design custom light shapes or outline your desk edges. High-density flexible silicon sleeve generating a seamless, uniform light path without hot spots, pre-configured in solid cobalt blue.",
    "specs": {
      "Length": "2 meters flexible neon tube",
      "Diffuser": "Frosted food-grade silicon sheath",
      "LED Count": "120 LEDs per meter",
      "Power Interface": "12V wall adapter included"
    }
  },
  {
    "id": 34,
    "name": "Nebula Hexagon Tiles Kit",
    "price": 129,
    "rating": 4.9,
    "reviews": 81,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "7-pack of modular wall hexagon light tiles.",
    "description": "Design your wall layout with ease. These modular panels snap together magnetically. Features solid white frames with beautiful, uniform front face light diffusion that projects various white and blue animations.",
    "specs": {
      "Pack Quantity": "7 modular hexagon panels",
      "Mounting": "Heavy-duty wall adhesives included",
      "Connection": "Snap-together magnetic power link connectors",
      "Software Control": "WiFi Alexa / Google Home controllers"
    }
  },
  {
    "id": 35,
    "name": "Aero-Glow Under-Desk Light",
    "price": 49,
    "rating": 4.6,
    "reviews": 55,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Dual under-desk light bars with magnetic mounts.",
    "description": "Highlight your leg space and cabling workspace. Pair of aluminum bars designed to mount under-desk surfaces, bathing the floor area in cozy blue lighting.",
    "specs": {
      "Quantity": "Dual 30cm light bars",
      "Mount": "Adhesive magnetic plate holders",
      "Control": "Inline desk push controller",
      "Color Options": "Ice Blue, Royal Blue, Soft White, Bright Cyan"
    }
  },
  {
    "id": 36,
    "name": "Apex Smart Lightbulb",
    "price": 24,
    "rating": 4.8,
    "reviews": 167,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "E26 smart LED bulb focusing on blue-white color schemes.",
    "description": "Screw into any standard desk lamp. Highly optimized to output high-accuracy color temperatures from bright morning white to relaxing evening ice-blue, easily managed from your phone.",
    "specs": {
      "Fitting": "Standard E26 / E27 bulb base socket",
      "Luminous Output": "8.5W (60W equivalent, 800 lumens)",
      "Sync Frequency": "2.4Ghz WiFi direct connection",
      "Lifespan": "Up to 25,000 hours runtime"
    }
  },
  {
    "id": 37,
    "name": "Nebula Light Ring Dial",
    "price": 45,
    "rating": 4.7,
    "reviews": 42,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Wireless desktop rotary controller for Nebula series lights.",
    "description": "Manage all SWEETOS lights from one central dial. Heavy machined aluminum dial with white coating and blue indicator ring. Rotate to adjust brightness, press to select light zones.",
    "specs": {
      "Interface": "Wireless RF 2.4Ghz link",
      "Material": "Anodized aluminum casing",
      "Range": "Up to 15 meters indoors",
      "Power Type": "AAA batteries (up to 12 months life)"
    }
  },
  {
    "id": 38,
    "name": "Aero-Clip Reading Lamp",
    "price": 29,
    "rating": 4.5,
    "reviews": 59,
    "category": "Lighting",
    "image": "./assets/desk_lamp.jpg",
    "shortDesc": "Compact clamp-on reading light with flexible neck.",
    "description": "Clamps to books, monitor stands, or bed rails. Clean white design with blue accent lines. Offers narrow reading beams with low blue-light eye protection settings.",
    "specs": {
      "Neck Type": "18cm flexible silicone gooseneck",
      "Clamp Opening": "Up to 3cm clamp clearance",
      "Light modes": "3 steps brightness, 3 color modes",
      "Power Source": "USB rechargeable built-in cell"
    }
  },
  {
    "id": 39,
    "name": "Aero-Stand Monitor Riser",
    "price": 95,
    "rating": 4.6,
    "reviews": 64,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "White-finished wooden riser with heavy-duty blue steel brackets.",
    "description": "Improve ergonomics and reclaim desktop real estate. The Aero-Stand is crafted from premium density fiberboard coated in clean satin-white, resting on powder-coated structural steel brackets in cobalt blue. Its spacious design allows you to tuck away full-sized mechanical keyboards when not in use.",
    "specs": {
      "Dimensions": "50cm L x 22cm W x 10cm H",
      "Weight Capacity": "Up to 25kg (55 lbs)",
      "Material": "Premium MDF wood shelf, alloy steel support brackets",
      "Leg Padding": "Non-slip silicone pads",
      "Under-shelf Clearance": "8.5cm height"
    }
  },
  {
    "id": 40,
    "name": "Aero-Mat Desk Pad",
    "price": 39,
    "rating": 4.8,
    "reviews": 112,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Water-resistant navy blue desk pad with sky blue stitching.",
    "description": "Protect your desk and enhance optical mouse tracking. The Aero-Mat features a dual-layer structure with a heavy, textured navy blue woven felt surface and a non-slip natural rubber base. Reinforced white-and-blue stitching along the perimeter prevents fraying and anchors your white-and-blue workspace aesthetics.",
    "specs": {
      "Size": "900mm x 400mm x 4mm thickness",
      "Surface Material": "Ultra-smooth high-density felt (water-repellent)",
      "Base Material": "Natural non-slip rubber",
      "Stitching": "Overlocked nylon threads (Sky blue and White)",
      "Cleaning": "Hand washable / wipeable"
    }
  },
  {
    "id": 41,
    "name": "Apex Monitor Arm Single",
    "price": 115,
    "rating": 4.8,
    "reviews": 94,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Gas spring single monitor mount in matte white.",
    "description": "Free up massive desk space. Heavy-duty gas spring articulating monitor mount in clean white with blue cable routing caps. Supports smooth height and tilt adjustments with single-finger touch.",
    "specs": {
      "Supported Screens": "17\" to 32\" monitor size",
      "VESA Pattern": "75x75mm or 100x100mm brackets",
      "Weight Support": "2kg to 9kg monitor load",
      "Tilt & Swivel": "+90° to -90° tilts, 360° rotation"
    }
  },
  {
    "id": 42,
    "name": "Aero-Tray Cable Organizer",
    "price": 45,
    "rating": 4.7,
    "reviews": 76,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Under-desk cable management tray in white steel.",
    "description": "Tame your power blocks and wire clusters. Heavy steel tray designed to mount under any wood desk. Detailed in white powder coating with blue rubber organizing grommet channels.",
    "specs": {
      "Size": "60cm L x 12cm W x 10cm D",
      "Mounting type": "Wood screws template included",
      "Material": "Cold-rolled solid steel",
      "Accessories": "10x blue velcro cable wraps included"
    }
  },
  {
    "id": 43,
    "name": "Apex Ergonomic Desk Chair",
    "price": 349,
    "rating": 4.9,
    "reviews": 122,
    "category": "Desks",
    "image": "./assets/headphones.jpg",
    "shortDesc": "High-back mesh chair in white frame and blue cushions.",
    "description": "Luxury ergonomic seating for long coding sessions. Curved high-back backrest with self-adjusting lumbar supports in clean white structure, layered with royal blue mesh cushions.",
    "specs": {
      "Seat Mesh": "High-elastic cooling mesh (Royal Blue)",
      "Base Structure": "Reinforced nylon white star base",
      "Armrests": "3D adjustable white/grey arm cushions",
      "Gas Lift Class": "Heavy-duty Class 4 cylinder"
    }
  },
  {
    "id": 44,
    "name": "Aero-Pegboard Organizer",
    "price": 79,
    "rating": 4.8,
    "reviews": 84,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Table clamp pegboard panel with organizers.",
    "description": "Display your keyboards and tools vertically. Heavy steel table-clamp pegboard panel finished in pure white, containing a set of 5 custom hooks and containers in cobalt-blue accent paints.",
    "specs": {
      "Panel Size": "42cm W x 52cm H panel",
      "Clamping Type": "Clamping bases (no drilling needed)",
      "Accessories": "2x keycap boxes, 3x keyboard hooks, 1x cable hook",
      "Material": "Solid alloy steel panels"
    }
  },
  {
    "id": 45,
    "name": "Aero-Dock Wooden Station",
    "price": 59,
    "rating": 4.7,
    "reviews": 62,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Vertical laptop dock stand in maple and blue base.",
    "description": "Save space with vertical storage. Handcrafted vertical laptop dock stand in white maple wood, lined with soft navy-blue felt and resting on a blue steel stabilizing base.",
    "specs": {
      "Material": "Solid Maple wood block, alloy base",
      "Lining": "100% thick merino felt (navy blue)",
      "Slot Width": "Adjustable from 12mm to 28mm",
      "Padding": "Silicone non-slip floor padding"
    }
  },
  {
    "id": 46,
    "name": "Apex Silicon Desk Organizer",
    "price": 25,
    "rating": 4.6,
    "reviews": 110,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Premium silicon organizer tray with keycap slots.",
    "description": "Organize pens, flash drives, and small desk accessories. Formed in high-density soft silicone in sky blue, featuring specialized slots to hold mechanical keycaps and pullers.",
    "specs": {
      "Material": "Food-grade elastic silicone",
      "Dimensions": "20cm L x 10cm W x 2cm H",
      "Compartments": "5 organizing sections, 2 keycap slots",
      "Washable": "Water and dust repellent"
    }
  },
  {
    "id": 47,
    "name": "Aero-Shelf Wall Accent",
    "price": 49,
    "rating": 4.8,
    "reviews": 51,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Floating wall shelf in white maple and blue brackets.",
    "description": "Add a floating shelf above your setup to showcase collectibles. Solid white maple wood board resting on heavy cobalt blue metal brackets.",
    "specs": {
      "Dimensions": "60cm L x 18cm W x 2cm thickness",
      "Weight Load": "Up to 15kg wall load capacity",
      "Shelf Wood": "Pure natural solid maple board",
      "Mount Brackets": "2x heavy-duty steel brackets (Cobalt Blue)"
    }
  },
  {
    "id": 48,
    "name": "Aero-Stand Phone Holder",
    "price": 24,
    "rating": 4.7,
    "reviews": 93,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Aluminum phone stand with blue charging routing.",
    "description": "Keep your smartphone at viewing angles. Made of solid matte white aluminum with a pass-through charging channel lined with sky-blue silicon padding.",
    "specs": {
      "Adjustments": "Dual-axis pivot adjustments (up to 270°)",
      "Material": "White bead-blasted aluminum alloy",
      "Inner Padding": "Anti-scratch silicone pads",
      "Weight": "120 grams"
    }
  },
  {
    "id": 49,
    "name": "Aero-Brush Anti-Dust Set",
    "price": 15,
    "rating": 4.5,
    "reviews": 67,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Minimalist cleaning brush with blue steel grip.",
    "description": "Tidy up your desk pads and keyboards. Curved micro-bristle brush with a white base and a blue aluminum loop grip. Removes hair, dust, and eraser crumbs easily.",
    "specs": {
      "Bristles Type": "Soft anti-static nylon bristles",
      "Handle Material": "Anodized blue aluminum frame",
      "Base Block": "White ABS polymer base block",
      "Dimensions": "12cm L x 4cm H brush width"
    }
  },
  {
    "id": 50,
    "name": "Aero-Solder Custom Station",
    "price": 139,
    "rating": 4.9,
    "reviews": 31,
    "category": "Desks",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "Soldering iron station for mechanical keyboard mods.",
    "description": "Mod keyboards safely. Professional adjustable temperature soldering iron base in matte white with digital blue LED temperature dials and brass wire holders.",
    "specs": {
      "Power Wattage": "65W heating power base",
      "Temp Range": "200°C to 480°C adjustable",
      "Display": "1.3-inch OLED blue text display screen",
      "Stand Base": "Heavy-duty anti-tip steel stand (White)"
    }
  },
  {
    "id": 51,
    "name": "Apple Studio Display 27\" 5K",
    "price": 1599,
    "rating": 4.9,
    "reviews": 84,
    "category": "Desks",
    "image": "./assets/monitor_stand.jpg",
    "shortDesc": "Stunning 27-inch 5K Retina display with high-end tilt-adjustable stand.",
    "description": "A window into another world. The Studio Display features a slim all-aluminum enclosure, a breathtaking 27-inch 5K Retina screen with 600 nits of brightness, and support for one billion colors. Equipped with a 12MP Ultra Wide camera, studio-quality microphones, and a six-speaker sound system with Spatial Audio.",
    "specs": {
      "Screen Size": "27-inch (diagonal) active area",
      "Resolution": "5120-by-2880 resolution at 218 pixels per inch",
      "Brightness": "600 nits brightness levels",
      "Camera": "12MP Ultra Wide camera with 122° field of view, Center Stage",
      "Audio": "High-fidelity six-speaker system with force-cancelling woofers",
      "Ports": "One Thunderbolt 3 (USB-C) upstream, three USB-C downstream"
    }
  },
  {
    "id": 52,
    "name": "Apple Magic Keyboard with Touch ID",
    "price": 149,
    "rating": 4.8,
    "reviews": 132,
    "category": "Keyboards",
    "image": "./assets/keyboard.jpg",
    "shortDesc": "Wireless rechargeable keyboard with fast, secure Touch ID login.",
    "description": "Magic Keyboard with Touch ID delivers a remarkably comfortable and precise typing experience. It is also wireless and rechargeable, with an incredibly long-lasting internal battery that powers your keyboard for about a month or more between charges. It pairs automatically with your Mac, so you can get to work right away.",
    "specs": {
      "Connectivity": "Bluetooth, Lightning port (charge link)",
      "Security": "Integrated Touch ID fingerprint sensor",
      "Key Switch": "Low-profile scissor mechanism layout",
      "Battery Life": "Up to 1 month continuous runtime",
      "Chassis": "Minimalist ultra-thin recycled aluminum shell"
    }
  },
  {
    "id": 53,
    "name": "Apple Magic Trackpad",
    "price": 129,
    "rating": 4.8,
    "reviews": 95,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Wireless rechargeable trackpad with full Force Touch and guest support.",
    "description": "Magic Trackpad is wireless and rechargeable, and it includes the full range of Multi-Touch gestures and Force Touch technology. Sensors under the trackpad surface detect subtle differences in the amount of pressure you apply, bringing more functionality to your fingertips and enabling a deeper connection to your content.",
    "specs": {
      "Surface Material": "Edge-to-edge smooth satin glass structure",
      "Tech Support": "Force Touch, Multi-Touch gestures mapping",
      "Connectivity": "Bluetooth link, Lightning interface",
      "Battery Life": "Up to 1 month per charge cycle",
      "Weight": "230 grams"
    }
  },
  {
    "id": 54,
    "name": "Apple Mac Studio M2 Max",
    "price": 1999,
    "rating": 4.9,
    "reviews": 42,
    "category": "Desks",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "High-performance compact workstation engine for creative pros.",
    "description": "Mac Studio is an entirely new Mac desktop. It packs outrageous performance, extensive connectivity, and new capabilities into an unbelievably compact form, putting everything you need within easy reach and transforming any space into a professional studio workstation.",
    "specs": {
      "Processor": "Apple M2 Max chip (12-core CPU, 30-core GPU)",
      "Memory": "32GB unified memory framework",
      "Storage": "512GB ultra-fast SSD storage",
      "Cooling": "Double-sided blower system, low acoustics",
      "Ports": "4x Thunderbolt 4, 2x USB-A, 1x HDMI, 10Gb Ethernet, SDXC slot"
    }
  },
  {
    "id": 55,
    "name": "Apple AirPods Max (Silver)",
    "price": 549,
    "rating": 4.7,
    "reviews": 185,
    "category": "Audio",
    "image": "./assets/headphones.jpg",
    "shortDesc": "Premium over-ear ANC headphones with high-fidelity workspace acoustics.",
    "description": "AirPods Max reimagine over-ear headphones. An Apple-designed dynamic driver provides immersive high-fidelity audio. Every detail, from canopy to cushions, has been designed for an exceptional fit. Active Noise Cancellation blocks outside noise, while Transparency mode lets it back in.",
    "specs": {
      "Audio Tech": "Apple-designed dynamic driver, Active Noise Cancellation",
      "Chipset": "Apple H1 headphone chip (each earcup)",
      "Sensors": "Optical, Position, Case-detect, Accelerometer, Gyroscope",
      "Battery Life": "Up to 20 hours of listening on a single charge",
      "Material": "Knit mesh canopy, memory foam ear cushions, stainless steel frame"
    }
  },
  {
    "id": 56,
    "name": "Apple Magic Mouse 3",
    "price": 79,
    "rating": 4.4,
    "reviews": 210,
    "category": "Desks",
    "image": "./assets/desk_mat.jpg",
    "shortDesc": "Wireless rechargeable mouse with Multi-Touch gesture support.",
    "description": "Magic Mouse is wireless and rechargeable, with an optimized foot design that lets it glide smoothly across your desk. The Multi-Touch surface allows you to perform simple gestures, such as swiping between web pages and scrolling through documents.",
    "specs": {
      "Sensor": "High-accuracy optical tracking engine",
      "Surface": "Multi-Touch glass gesture zone",
      "Connectivity": "Bluetooth, Lightning port interface",
      "Battery": "Rechargeable internal lithium cell",
      "Weight": "99 grams"
    }
  },
  {
    "id": 57,
    "name": "Apple HomePod Speaker",
    "price": 299,
    "rating": 4.8,
    "reviews": 76,
    "category": "Audio",
    "image": "./assets/audio_dac.jpg",
    "shortDesc": "High-fidelity acoustic smart speaker with spatial room sensing.",
    "description": "HomePod is a powerhouse of a speaker. Apple-engineered audio technology and advanced software deliver high-fidelity sound throughout the room. It intelligently adapts to whatever it’s playing — or wherever it’s playing — and surrounds you in immersive audio that makes everything you listen to sound incredible.",
    "specs": {
      "Speaker Type": "High-excursion woofer, five beamforming tweeters array",
      "Microphones": "Four-mic design for far-field Siri control",
      "Sensing Tech": "Room sensing calibration, Spatial Audio, Stereo pairing",
      "Wireless Link": "802.11n Wi-Fi, Bluetooth 5.0, AirPlay 2 support",
      "Dimensions": "16.8cm H x 14.2cm W"
    }
  }
];

export default products;
