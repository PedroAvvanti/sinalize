type JitsiMeetExternalAPIOptions = {
  roomName: string;
  parentNode: HTMLElement;
  userInfo?: {
    displayName?: string;
  };
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (
      domain: string,
      options: JitsiMeetExternalAPIOptions,
    ) => {
      dispose: () => void;
      addListener: (event: string, listener: () => void) => void;
    };
  }
}

export {};
