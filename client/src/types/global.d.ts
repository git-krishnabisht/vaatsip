declare global {
  interface Window {
    updateSidebarConversation?: (message: any) => void;
  }
}

export {};
