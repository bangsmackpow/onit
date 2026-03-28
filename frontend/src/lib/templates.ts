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
        description: 'Standard engine oil and filter replacement',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Tire Rotation',
        description: 'Rotate tires to ensure even wear',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
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
    name: 'Home (Seasonal)',
    type: 'house',
    icon: '🏠',
    defaultTasks: [
      {
        name: 'HVAC Filter Change',
        description: 'Replace furnace/AC air filters',
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
        name: 'Gutter Cleaning',
        description: 'Clean debris from roof gutters',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 14
      },
      {
        name: 'Water Heater Flush',
        description: 'Drain and flush water heater to remove sediment',
        recurrenceType: 'annual',
        recurrenceInterval: 1,
        reminderDaysBefore: 7
      }
    ]
  },
  {
    name: 'Kitchen Appliance',
    type: 'appliance',
    icon: '🧊',
    defaultTasks: [
      {
        name: 'Refrigerator Water Filter',
        description: 'Replace refrigerator water and ice filter',
        recurrenceType: 'biannual',
        recurrenceInterval: 1,
        reminderDaysBefore: 10
      },
      {
        name: 'Dishwasher Filter Clean',
        description: 'Clean the debris filter at the bottom of the dishwasher',
        recurrenceType: 'monthly',
        recurrenceInterval: 1,
        reminderDaysBefore: 3
      }
    ]
  }
]
