"use client";

import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      onChatMaximized?: () => void;
      onChatMinimized?: () => void;
      onChatHidden?: () => void;
      onChatStarted?: () => void;
      onChatEnded?: () => void;
      onPrechatSubmit?: (data: any) => void;
      onOfflineSubmit?: (data: any) => void;
      maximize?: () => void;
      minimize?: () => void;
      toggle?: () => void;
      popup?: () => void;
      showWidget?: () => void;
      hideWidget?: () => void;
      toggleVisibility?: () => void;
      endChat?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export function ChatWidget() {
  useEffect(() => {
    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    
    // Set up event handlers
    window.Tawk_API.onLoad = function() {
      console.log('Tawk.to chat widget loaded');
    };

    window.Tawk_API.onChatMaximized = function() {
      console.log('Chat maximized');
    };

    window.Tawk_API.onChatMinimized = function() {
      console.log('Chat minimized');
    };

    window.Tawk_API.onChatStarted = function() {
      console.log('Chat started');
    };

    window.Tawk_API.onChatEnded = function() {
      console.log('Chat ended');
    };

    window.Tawk_API.onPrechatSubmit = function(data: any) {
      console.log('Pre-chat form submitted:', data);
    };

    window.Tawk_API.onOfflineSubmit = function(data: any) {
      console.log('Offline form submitted:', data);
    };

    // Load Tawk.to script
    const Tawk_LoadStart = new Date();
    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    
    s1.async = true;
    s1.src = 'https://embed.tawk.to/684c069b4b5a53190afc6fb5/1itkfjkm5';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    if (s0?.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }
    
    // Cleanup function
    return () => {
      s1.remove();
      // Reset Tawk_API
      window.Tawk_API = {};
    };
  }, []);

  return null;
} 