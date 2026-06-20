'use client';

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from '@engine/lib/store/StoreProvider';
import { I18nProvider } from '@engine/lib/i18n/I18nProvider';
import { OverlayProvider } from '@engine/components/primitives';
import AppShell from '@engine/components/AppShell';
import Dashboard from '@engine/pages/Dashboard';
import Onboarding from '@engine/pages/Onboarding';
import BrandDetail from '@engine/pages/BrandDetail';
import CreateGraphic from '@engine/pages/CreateGraphic';
import GraphicEditor from '@engine/pages/GraphicEditor';
import MasterEditor from '@engine/pages/MasterEditor';
import ClipFinder from '@engine/pages/ClipFinder';

// Canvas templates draw with real "Inter"/"Bitter" families; the site
// loads Inter via next/font (hashed name) and not Bitter, so inject the
// real-named webfonts here.
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap';

// Mounted under the Next catch-all at /app/carousel; react-router owns
// everything below that path via basename.
export default function EngineApp() {
  useEffect(() => {
    document.title = 'Postio';
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  return (
    <BrowserRouter basename="/app/carousel">
      <I18nProvider>
        <StoreProvider>
          <OverlayProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="new" element={<Onboarding />} />
                <Route path="clips" element={<ClipFinder />} />
                <Route path="brands/:brandId" element={<BrandDetail />} />
                <Route path="brands/:brandId/create" element={<CreateGraphic />} />
                <Route path="templates/:templateId/master" element={<MasterEditor />} />
                <Route path="graphics/:graphicId" element={<GraphicEditor />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </OverlayProvider>
        </StoreProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
