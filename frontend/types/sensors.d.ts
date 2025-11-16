interface StepCounterSensor extends Sensor {
  steps: number;
}

interface StepCounterConstructor {
  new(): StepCounterSensor;
}

interface Window {
  StepCounter: StepCounterConstructor;
}

interface Sensor {
  activated: boolean;
  hasReading: boolean;
  timestamp: DOMHighResTimeStamp;
  start(): void;
  stop(): void;
  onreading: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

interface AccelerometerOptions {
  frequency?: number;
}

declare class Accelerometer {
  constructor(options?: AccelerometerOptions);
  x: number;
  y: number;
  z: number;
  timestamp: number;
  start(): void;
  stop(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface PermissionDescriptor {
  name: PermissionName;
}

interface Permissions {
  query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
}

interface Navigator {
  permissions: Permissions;
} 