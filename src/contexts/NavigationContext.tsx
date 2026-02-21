'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { pageLabelById, validPages } from '@/components/dashboard/navigation'

interface NavigationContextType {
  activePage: string;
  navigateTo: (page: string) => void;
  onPrefetch: (page?: string) => void;
  onLogout: () => void;
  pageSwitching: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
  pageLoaders: Record<string, () => Promise<unknown>>;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children, pageLoaders }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [activePage, setActivePage] = useState<string>('home');
  const [pagePreloading, setPagePreloading] = useState(false);
  const [isPageTransitionPending, startPageTransition] = useTransition();
  const navTokenRef = React.useRef(0);

  const pageSwitching = pagePreloading || isPageTransitionPending;

  // Synchroniseer activePage met de URL path
  useEffect(() => {
    if (!pathname) return; 

    const path = pathname.substring(1); // Verwijder de voorste '/'
    const newActivePage = path === '' ? 'home' : path;
    
    // Voer state update uit binnen startPageTransition om cascading renders te voorkomen
    if (newActivePage !== activePage) {
      startPageTransition(() => {
        setActivePage(newActivePage);
      });
    }
  }, [pathname, activePage, startPageTransition]);

  const navigateTo = useCallback((page: string) => {
    const nextPage = validPages.has(page) ? page : 'home';
    const targetPath = nextPage === 'home' ? '/' : `/${nextPage}`;

    if (targetPath === pathname) {
      // Already on the target page, just close overlays
      return;
    }

    const token = ++navTokenRef.current;
    setPagePreloading(true);

    const loader = pageLoaders[nextPage];
    void (async () => {
      try {
        await loader?.();
      } catch (error) {
        console.error(`Fout bij preladen van pagina ${nextPage}:`, error);
      }

      if (navTokenRef.current !== token) return;
      startPageTransition(() => {
        setActivePage(nextPage);
        router.push(targetPath);
      });
      setPagePreloading(false);
    })();
  }, [activePage, pathname, router, startPageTransition, pageLoaders]);

  const onPrefetch = useCallback((page?: string) => {
    if (!page) return;
    const loader = pageLoaders[page];
    if (!loader) return;
    void loader().catch(() => {});
  }, [pageLoaders]);

  const onLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('archonpro.activePage');
    }
    startPageTransition(() => {
      setActivePage('home');
      router.push('/');
    });
    toast({
      title: 'Uitloggen',
      description: 'Authenticatie is nog niet gekoppeld in deze demo.',
    });
  }, [router, startPageTransition]);

  return (
    <NavigationContext.Provider value={{ activePage, navigateTo, onPrefetch, onLogout, pageSwitching }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
