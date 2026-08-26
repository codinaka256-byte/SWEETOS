const products = [
  {
    id: 1,
    name: "Aero-75 Mechanical Keyboard",
    price: 145000,
    originalPrice: 180000,
    category: "Keyboards",
    subcategory: "Custom Keyboards",
    brand: "Aero",
    rating: 4.9,
    reviews: 128,
    stock: 24,
    inStock: true,
    isBestseller: true,
    isHotDeal: true,
    isNew: true,
    image: "./assets/keyboard.jpg",
    description: "Ultra-compact 75% mechanical keyboard with custom pre-lubed linear switches, sound-dampening foam, hot-swappable sockets, and ice-blue per-key RGB backlighting in a CNC machined aluminum frame.",
    colors: [
      { name: "Ice Blue", hex: "#00b4d8", image: "./assets/keyboard.jpg" },
      { name: "Space Grey", hex: "#475569", image: "./assets/keyboard.jpg" },
      { name: "Obsidian Black", hex: "#0f172a", image: "./assets/keyboard.jpg" }
    ],
    gallery: [
      "./assets/keyboard.jpg"
    ],
    specs: {
      "Form Factor": "75% Compact (84 Keys)",
      "Switches": "Pre-Lubed Linear 45g",
      "Connectivity": "USB-C, Bluetooth 5.2, 2.4GHz Wireless",
      "Battery": "4000mAh Lithium-ion",
      "Chassis": "Anodized Aluminum"
    }
  },
  {
    id: 2,
    name: "Apex Studio Titanium Headphones",
    price: 185000,
    originalPrice: 220000,
    category: "Audio",
    subcategory: "Studio Headphones",
    brand: "Apex",
    rating: 4.8,
    reviews: 94,
    stock: 18,
    inStock: true,
    isBestseller: true,
    isHotDeal: false,
    isNew: true,
    image: "./assets/headphones.jpg",
    description: "Audiophile open-back studio headphones equipped with 50mm titanium dynamic transducers and breathable acoustic velour ear cushions for pinpoint spatial sound reproduction.",
    colors: [
      { name: "Matte White", hex: "#f8fafc", image: "./assets/headphones.jpg" },
      { name: "Titanium Silver", hex: "#cbd5e1", image: "./assets/headphones.jpg" }
    ],
    gallery: [
      "./assets/headphones.jpg"
    ],
    specs: {
      "Transducer": "50mm Titanium Dynamic",
      "Frequency Response": "10Hz - 42,000Hz",
      "Impedance": "32 Ohms",
      "Cable": "Detachable Braided 3.5mm + 6.35mm Gold Adapter"
    }
  },
  {
    id: 3,
    name: "Nebula Dual Monitor Stand",
    price: 95000,
    originalPrice: 125000,
    category: "Desks",
    subcategory: "Monitor Stands",
    brand: "Nebula",
    rating: 5.0,
    reviews: 67,
    stock: 12,
    inStock: true,
    isBestseller: false,
    isHotDeal: true,
    isNew: false,
    image: "./assets/monitor_stand.jpg",
    description: "Handcrafted dual monitor riser built from sustainably sourced solid American Walnut with integrated aluminum dock tray and stealth cable channels.",
    colors: [
      { name: "American Walnut", hex: "#543818", image: "./assets/monitor_stand.jpg" },
      { name: "Natural Oak", hex: "#a16207", image: "./assets/monitor_stand.jpg" }
    ],
    gallery: [
      "./assets/monitor_stand.jpg"
    ],
    specs: {
      "Material": "Solid Hardwood + Aircraft Aluminum",
      "Length": "108 cm",
      "Load Capacity": "45 kg",
      "Finish": "Hand-Applied Matte Organic Oil"
    }
  },
  {
    id: 4,
    name: "Lumina ScreenBar Pro Lamp",
    price: 65000,
    originalPrice: 85000,
    category: "Lighting",
    subcategory: "ScreenBars",
    brand: "SWEETOS",
    rating: 4.7,
    reviews: 52,
    stock: 30,
    inStock: true,
    isBestseller: false,
    isHotDeal: false,
    isNew: true,
    image: "./assets/desk_lamp.jpg",
    description: "Smart asymmetrical LED monitor light bar with auto-dimming ambient light sensor, wireless control dial, and zero screen glare technology.",
    colors: [
      { name: "Matte Black", hex: "#1e293b", image: "./assets/desk_lamp.jpg" }
    ],
    gallery: [
      "./assets/desk_lamp.jpg"
    ],
    specs: {
      "Color Temperature": "2700K - 6500K Stepless",
      "Power": "USB-C Powered (5V 2A)",
      "Control": "Wireless Rotary Touch Controller",
      "CRI": "Ra > 95"
    }
  },
  {
    id: 5,
    name: "Apex Hi-Res 32-Bit Audio DAC",
    price: 110000,
    originalPrice: 135000,
    category: "Audio",
    subcategory: "DAC & Amps",
    brand: "Apex",
    rating: 4.9,
    reviews: 41,
    stock: 15,
    inStock: true,
    isBestseller: false,
    isHotDeal: false,
    isNew: false,
    image: "./assets/audio_dac.jpg",
    description: "Precision 32-bit/768kHz DSD512 audiophile desktop DAC and balanced headphone amplifier with ultra-low distortion ESS Sabre chipset.",
    colors: [
      { name: "Space Silver", hex: "#94a3b8", image: "./assets/audio_dac.jpg" }
    ],
    gallery: [
      "./assets/audio_dac.jpg"
    ],
    specs: {
      "Chipset": "ESS Sabre ES9038Q2M",
      "Sample Rate": "PCM 32-bit/768kHz, DSD512",
      "Outputs": "4.4mm Balanced + 6.35mm Single-Ended",
      "THD+N": "< 0.00008%"
    }
  },
  {
    id: 6,
    name: "Nebula Merino Felt Desk Mat",
    price: 45000,
    originalPrice: 55000,
    category: "Desks",
    subcategory: "Desk Mats",
    brand: "Nebula",
    rating: 4.8,
    reviews: 83,
    stock: 40,
    inStock: true,
    isBestseller: true,
    isHotDeal: false,
    isNew: false,
    image: "./assets/desk_mat.jpg",
    description: "Extra large 90x40cm premium wool felt desk pad with anti-slip silicone dot backing and stitched edges for smooth mouse tracking and wrist comfort.",
    colors: [
      { name: "Dark Charcoal", hex: "#334155", image: "./assets/desk_mat.jpg" },
      { name: "Heather Grey", hex: "#64748b", image: "./assets/desk_mat.jpg" }
    ],
    gallery: [
      "./assets/desk_mat.jpg"
    ],
    specs: {
      "Dimensions": "900 x 400 x 4 mm",
      "Material": "100% Virgin Merino Wool Felt",
      "Backing": "Anti-Slip Silicone Micro-Dots",
      "Water Repellent": "Yes (Hydrophobic Coating)"
    }
  }
];

export default products;
