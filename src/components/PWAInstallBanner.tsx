import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // On iOS, show manual instructions
    if (ios) {
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) setShowBanner(true);
      return;
    }

    // Android / Chrome: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] flex items-center justify-center shrink-0 shadow-md">
            <span className="text-xl font-black text-white">G</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-foreground">Installer G-CRM</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {isIOS
                ? 'Appuyez sur le bouton Partager puis "Sur l\'écran d\'accueil" pour installer l\'app.'
                : 'Installez l\'application sur votre appareil pour un accès rapide et hors-ligne.'}
            </p>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground text-lg leading-none shrink-0 mt-0.5">✕</button>
        </div>
        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button onClick={dismiss} className="flex-1 bg-background border border-border text-muted-foreground py-2 rounded-lg text-xs font-bold hover:bg-card transition-all">
              Plus tard
            </button>
            <button onClick={handleInstall} className="flex-1 bg-gradient-to-r from-[hsl(168,100%,31%)] to-[hsl(160,84%,39%)] text-white py-2 rounded-lg text-xs font-bold shadow-md hover:-translate-y-px transition-all">
              📲 Installer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
