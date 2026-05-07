// frontend/src/lib/templates.ts

export interface TaskTemplate {
  name: string
  description: string
  recurrenceType: 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'once'
  recurrenceInterval: number
  reminderDaysBefore: number
}

export interface AssetTemplate {
  name: string
  type: 'car' | 'house' | 'appliance'
  icon: string
  defaultTasks: TaskTemplate[]
}

export const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    name: 'Standard Vehicle',
    type: 'car',
    icon: '🚗',
    defaultTasks: [
      {
        name: 'Oil & Filter Change',
        description: 'Standard engine oil and filter replacement (5k-7.5k miles)',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Tire Rotation',
        description: 'Rotate tires to ensure even wear and extend tire life',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Engine Air Filter',
        description: 'Replace engine air filter for better fuel economy',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Cabin Air Filter',
        description: 'Replace interior air filter to prevent dust/odors',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Brake Fluid Flush',
        description: 'Flush and replace brake fluid to prevent moisture buildup',
        recurrenceType: 'annual', // Often 2 years, but annual check is best
        recurrenceInterval: 2,
        reminderDaysBefore: 30
      },
      {
        name: 'Wiper Blade Replacement',
        description: 'Replace blades before rainy or snowy seasons',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Battery Terminal Clean',
        description: 'Remove corrosion and check battery health',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Tire Pressure Check',
        description: 'Calibrate tire pressure for safety and MPG',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 1
      },
      {
        name: 'Vehicle Registration',
        description: 'Annual registration renewal with DMV',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 30
      },
      {
        name: 'State Inspection',
        description: 'Annual safety and emissions inspection',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 30
      }
    ]
  },
  {
    name: 'Home Interior (Vital)',
    type: 'house',
    icon: '🏠',
    defaultTasks: [
      {
        name: 'HVAC Filter Change',
        description: 'Replace furnace/AC air filters for efficiency and air quality',
        recurrenceType: 'quarterly',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Smoke Detector Test',
        description: 'Test all smoke and carbon monoxide detectors',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 3
      },
      {
        name: 'Water Heater Flush',
        description: 'Drain and flush water heater to remove sediment buildup',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Dryer Vent Cleaning',
        description: 'Remove lint from dryer exhaust to prevent fires',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Bathroom Exhaust Fans',
        description: 'Vacuum dust from motors and covers',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Garbage Disposal Clean',
        description: 'Grind ice and lemon peels to sanitize disposal',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 1
      },
      {
        name: 'Drain Maintenance',
        description: 'Flush drains with baking soda and vinegar',
        recurrenceType: 'quarterly',
        recurrenceInterval: 1,
        reminderDaysBefore: 2
      },
      {
        name: 'Fire Extinguisher Check',
        description: 'Check pressure gauge and inspection tag',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Sump Pump Test',
        description: 'Manually trigger sump pump to ensure operation',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Window Seal Check',
        description: 'Inspect caulk and weatherstripping for drafts',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      }
    ]
  },
  {
    name: 'Lawn & Garden',
    type: 'house',
    icon: '🌿',
    defaultTasks: [
      {
        name: 'Lawn Fertilizer #1 (Early Spring)',
        description: 'Apply pre-emergent and crabgrass preventer',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Lawn Fertilizer #2 (Late Spring)',
        description: 'Apply weed and feed for broadleaf control',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Lawn Fertilizer #3 (Summer)',
        description: 'Apply high-heat resistant fertilizer',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Lawn Fertilizer #4 (Fall)',
        description: 'Apply winterizer to strengthen root systems',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Gutter Cleaning (Spring)',
        description: 'Clean debris after blossoms and seeds drop (June)',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Gutter Cleaning (Fall)',
        description: 'Clean debris after final leaf drop (November)',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Sprinkler Blowout',
        description: 'Drain and winterize irrigation system',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Sprinkler Startup',
        description: 'Verify all zones and check for broken heads',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Lawn Aeration',
        description: 'Core aerate to reduce soil compaction',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Hose Bib Winterization',
        description: 'Disconnect hoses and turn off exterior water lines',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      }
    ]
  },
  {
    name: 'Kitchen Appliances',
    type: 'appliance',
    icon: '🍳',
    defaultTasks: [
      {
        name: 'Fridge Water Filter',
        description: 'Replace internal refrigerator water filter',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Refrigerator Coils',
        description: 'Vacuum dust from coils for cooling efficiency',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Dishwasher Filter Clean',
        description: 'Clean debris filter at bottom of unit',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 3
      },
      {
        name: 'Range Hood Filter',
        description: 'Degrease metal filters in sink or dishwasher',
        recurrenceType: 'quarterly',
        recurrenceInterval: 1,
        reminderDaysBefore: 5
      },
      {
        name: 'Oven Deep Clean',
        description: 'Manual or self-clean cycle to remove grease',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Coffee Maker Descale',
        description: 'Run vinegar or descaling solution through system',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 2
      }
    ]
  },
  {
    name: 'Laundry & Utility',
    type: 'appliance',
    icon: '🧺',
    defaultTasks: [
      {
        name: 'Washer Clean Cycle',
        description: 'Run empty hot cycle with vinegar or cleaner',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 3
      },
      {
        name: 'Washing Machine Hoses',
        description: 'Check for bulges, cracks, or leaks',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Dryer Internal Lint Check',
        description: 'Vacuum lint from inside the dryer drum area',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Garage Door Lubrication',
        description: 'Apply lithium grease to rollers, tracks, and springs',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Water Softener Salt',
        description: 'Check and refill salt pellets',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 1
      }
    ]
  },
  {
    name: 'Outdoor Equipment',
    type: 'appliance',
    icon: '🚜',
    defaultTasks: [
      {
        name: 'Mower Oil Change',
        description: 'Change engine oil at start of season',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Mower Blade Sharpen',
        description: 'Sharpen blades for cleaner grass cuts',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Mower Air Filter',
        description: 'Clean or replace small engine air filter',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Fuel Stabilizer',
        description: 'Add to gas before winter storage',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Spark Plug Check',
        description: 'Inspect and replace spark plugs every 2 years',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      }
    ]
  },
  {
    name: 'Deep Cleaning',
    type: 'house',
    icon: '🧹',
    defaultTasks: [
      {
        name: 'Wash Curtains/Drapes',
        description: 'Remove dust and allergens from window treatments',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 30
      },
      {
        name: 'Steam Clean Rugs',
        description: 'Deep clean high-traffic carpeted areas',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 30
      },
      {
        name: 'Flip/Rotate Mattress',
        description: 'Ensure even wear on mattresses',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Wash Pillows',
        description: 'Sanitize pillows in washing machine',
        recurrenceType: 'quarterly',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      },
      {
        name: 'Furniture Vacuum',
        description: 'Vacuum under and behind heavy furniture',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      }
    ]
  }
]
