'use client';

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from '@engine/lib/store/StoreProvider';
import { I18nProvider } from '@engine/lib/i18n/I18nProvider';
import { SettingsProvider } from '@engine/lib/settings/SettingsProvider';
import { OverlayProvider } from '@engine/components/primitives';
import AppShell from '@engine/components/AppShell';
import Dashboard from '@engine/pages/Dashboard';
import Onboarding from '@engine/pages/Onboarding';
import BrandDetail from '@engine/pages/BrandDetail';
import CreateGraphic from '@engine/pages/CreateGraphic';
import GraphicEditor from '@engine/pages/GraphicEditor';
import MasterEditor from '@engine/pages/MasterEditor';
import Pipeline from '@engine/pages/Pipeline';
import PipelineLauncher, { BrandClipsRedirect } from '@engine/pages/PipelineLauncher';
import Settings from '@engine/pages/Settings';
import Campaigns from '@engine/pages/Campaigns';

// The UI chrome is set in Geist (matching the marketing site). Canvas
// templates still draw with real "Inter"/"Bitter" families, so all three are
// loaded; Geist is applied to the engine root and inherits down to the UI.
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700;800&family=Geist:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap';

// Brand motion + flourishes, scoped to the engine. Easing matches the
// marketing site's ease-out-soft curve; reduced-motion users get no entrance.
const ENGINE_CSS = `
.postio-engine, .postio-engine h1, .postio-engine h2, .postio-engine h3, .postio-engine h4, .postio-engine h5,
.postio-engine button, .postio-engine input, .postio-engine textarea, .postio-engine select {
  font-family: 'Geist', ui-sans-serif, system-ui, sans-serif;
}
.postio-engine .eng-rise { animation: eng-rise .6s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes eng-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.postio-engine .eng-gradient {
  background: linear-gradient(100deg, #6d28d9 0%, #8b5cf6 55%, #0ea5e9 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.postio-engine ::selection { background: #ddd6fe; color: #18181b; }
.postio-engine.dark ::selection { background: #4c1d95; color: #f4f4f5; }

/* ── Density tokens ──────────────────────────────────────────────
   Comfortable (default) / Compact (power users) / Touch (mobile + a11y).
   The shared kit's controls carry .eng-control and read these vars, so the
   density setting visibly changes control height + padding app-wide. */
.postio-engine {
  --eng-ctl-min: 2.5rem;     /* 40px */
  --eng-ctl-py: 0.5rem;      /* 8px  */
  --eng-ctl-fs: 13px;
}
.postio-engine[data-density="compact"] {
  --eng-ctl-min: 2rem;       /* 32px */
  --eng-ctl-py: 0.3125rem;   /* 5px  */
  --eng-ctl-fs: 12.5px;
}
.postio-engine[data-density="touch"] {
  --eng-ctl-min: 2.75rem;    /* 44px — WCAG min */
  --eng-ctl-py: 0.6875rem;   /* 11px */
  --eng-ctl-fs: 14px;
}
.postio-engine .eng-control {
  min-height: var(--eng-ctl-min);
  padding-top: var(--eng-ctl-py);
  padding-bottom: var(--eng-ctl-py);
  font-size: var(--eng-ctl-fs);
}
/* On coarse pointers (phones/tablets) never go below the 44px tap target,
   whatever density is chosen. */
@media (pointer: coarse) {
  .postio-engine { --eng-ctl-min: 2.75rem; --eng-ctl-py: 0.6875rem; }
}

/* Drawer / bottom-sheet entrances. */
.postio-engine .eng-slide-left { animation: eng-slide-left .28s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes eng-slide-left { from { transform: translateX(-100%); } to { transform: translateX(0); } }
.postio-engine .eng-slide-up { animation: eng-slide-up .3s cubic-bezier(0.22,1,0.36,1) both; }
@keyframes eng-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.postio-engine .eng-fade { animation: eng-fade .2s ease both; }
@keyframes eng-fade { from { opacity: 0; } to { opacity: 1; } }
/* Hide scrollbars on horizontally-scrollable rows (mobile tab strips etc.). */
.postio-engine .eng-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
.postio-engine .eng-noscroll::-webkit-scrollbar { display: none; }

@media (prefers-reduced-motion: reduce) {
  .postio-engine .eng-rise,
  .postio-engine .eng-slide-left,
  .postio-engine .eng-slide-up,
  .postio-engine .eng-fade { animation: none; }
}
`;

// Mounted under the Next catch-all at /app/postio; react-router owns
// everything below that path via basename.
export default function EngineApp() {
  useEffect(() => {
    document.title = 'Postio';
    if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_HREF;
      document.head.appendChild(link);
    }
    if (!document.getElementById('postio-engine-css')) {
      const style = document.createElement('style');
      style.id = 'postio-engine-css';
      style.textContent = ENGINE_CSS;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="postio-engine" style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" }}>
    <BrowserRouter basename="/app/postio">
      <I18nProvider>
        <SettingsProvider>
        <StoreProvider>
          <OverlayProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="new" element={<Onboarding />} />
                <Route path="clips" element={<PipelineLauncher />} />
                <Route path="brands/:brandId/clips" element={<BrandClipsRedirect />} />
                <Route path="brands/:brandId/pipeline" element={<Pipeline />} />
                <Route path="brands/:brandId" element={<BrandDetail />} />
                <Route path="brands/:brandId/create" element={<CreateGraphic />} />
                <Route path="templates/:templateId/master" element={<MasterEditor />} />
                <Route path="graphics/:graphicId" element={<GraphicEditor />} />
                <Route path="settings" element={<Settings />} />
                <Route path="campaigns" element={<Campaigns />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </OverlayProvider>
        </StoreProvider>
        </SettingsProvider>
      </I18nProvider>
    </BrowserRouter>
    </div>
  );
}
