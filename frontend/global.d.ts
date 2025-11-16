export {};

declare global {
  interface Window {
    Cal?: {
      (command: string, namespace: string, options?: any): void;
      ns: {
        secret: (command: string, options?: any) => void;
      };
    };
  }
}
