import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { GraphicElement } from '@engine/lib/model/types';

interface Props {
  elements: GraphicElement[];
  width: number; // canvas px (for aspect + font scaling)
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: GraphicElement[]) => void; // live (during drag)
  onCommit: () => void; // persist (drag end / edit end)
  onDelete?: (id: string) => void; // remove an element (bin handle on the box)
  onDropAsset?: (payload: { assetId: string; type: string; url: string }, x: number, y: number) => void;
  showSafe?: boolean;
  safeInsets?: { top: string; right: string; bottom: string; left: string };
}

type DragState = {
  id: string;
  mode: 'move' | 'resize';
  startX: number;
  startY: number;
  startPos: { x: number; y: number };
  startSize: { width: number; height: number };
  startFont: number; // text fontSize at drag start, for proportional resize
};

export default function Stage({ elements, width, height, selectedId, onSelect, onChange, onCommit, onDelete, onDropAsset, showSafe, safeInsets }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      const rect = ref.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const dx = (e.clientX - d.startX) / rect.width;
      const dy = (e.clientY - d.startY) / rect.height;
      onChange(
        elements.map((el) => {
          if (el.id !== d.id) return el;
          if (d.mode === 'move') {
            return { ...el, position: { x: clamp(d.startPos.x + dx, 0, 1 - el.size.width), y: clamp(d.startPos.y + dy, 0, 1 - el.size.height) } };
          }
          // Text: corner-drag UNIFORMLY scales the element (box + font together)
          // so the text grows with the box, the way every design tool behaves.
          if (el.type === 'text') {
            const ratio = clamp((d.startSize.width + dx) / d.startSize.width, 0.15, 6);
            return {
              ...el,
              size: { width: clamp(d.startSize.width * ratio, 0.04, 1), height: clamp(d.startSize.height * ratio, 0.03, 1) },
              style: { ...el.style, fontSize: clamp(d.startFont * ratio, 0.012, 0.4) },
            };
          }
          // Shapes / images: independent width + height resize (unchanged).
          return { ...el, size: { width: clamp(d.startSize.width + dx, 0.04, 1), height: clamp(d.startSize.height + dy, 0.03, 1) } };
        }),
      );
    };
    const onUp = () => {
      if (drag.current) {
        drag.current = null;
        onCommit();
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [elements, onChange, onCommit]);

  const startDrag = (e: React.PointerEvent, el: GraphicElement, mode: 'move' | 'resize') => {
    if (el.type === 'background' || editingId === el.id) return;
    e.stopPropagation();
    onSelect(el.id);
    drag.current = {
      id: el.id, mode, startX: e.clientX, startY: e.clientY,
      startPos: { ...el.position }, startSize: { ...el.size },
      startFont: ((el.style as Record<string, unknown> | undefined)?.fontSize as number) ?? 0.05,
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/x-asset');
    const rect = ref.current?.getBoundingClientRect();
    if (!raw || !rect || !onDropAsset) return;
    try {
      const payload = JSON.parse(raw);
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      onDropAsset(payload, x, y);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={() => onSelect(null)}
      onDragOver={(e) => { if (e.dataTransfer.types.includes('application/x-asset')) e.preventDefault(); }}
      onDrop={handleDrop}
      className="relative w-full select-none overflow-hidden rounded-xl border border-zinc-200 shadow-sm shadow-zinc-900/10 dark:border-zinc-700"
      // container-type lets text/radii size in cqi (1cqi = 1% of the stage's
      // rendered width) so the preview proportion matches the export exactly,
      // at any display size. (Fonts/radii are fractions of canvas width.)
      style={{ aspectRatio: `${width} / ${height}`, containerType: 'inline-size' }}
    >
      {elements.map((el) => {
        const s = (el.style ?? {}) as Record<string, unknown>;
        const selected = el.id === selectedId;
        const box: React.CSSProperties = {
          position: 'absolute',
          left: `${el.position.x * 100}%`,
          top: `${el.position.y * 100}%`,
          width: `${el.size.width * 100}%`,
          height: el.type === 'background' ? '100%' : `${el.size.height * 100}%`,
        };
        if (el.type === 'background') {
          const bgStyle: React.CSSProperties = el.content
            ? { ...box, left: 0, top: 0, backgroundImage: `url(${el.content})`, backgroundSize: ((s.fit as string) === 'contain' ? 'contain' : 'cover'), backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: (s.fill as string) ?? '#0c1322' }
            : { ...box, left: 0, top: 0, background: (s.fill as string) ?? '#0c1322' };
          return <div key={el.id} style={bgStyle} onPointerDown={(e) => { e.stopPropagation(); onSelect(el.id); }} />;
        }
        const common = 'absolute cursor-move';
        const ring = selected ? 'outline outline-2 outline-violet-500' : 'hover:outline hover:outline-1 hover:outline-zinc-300';
        if (el.type === 'text') {
          const editing = editingId === el.id;
          // Text boxes auto-grow to wrap their content. The stored size.height
          // is only a floor (minHeight) so an empty box stays grabbable; the
          // real height comes from the text itself, so extra lines never spill
          // past the selection outline or the resize / delete handles. This
          // also matches the export, which wraps text from the top regardless
          // of box height (see renderElements.drawTextWrapped).
          const textBox: React.CSSProperties = { ...box, height: 'auto', minHeight: `${el.size.height * 100}%` };
          return (
            <div
              key={el.id}
              className={`${common} ${ring}`}
              style={textBox}
              onPointerDown={(e) => startDrag(e, el, 'move')}
              onDoubleClick={() => { onSelect(el.id); setEditingId(el.id); }}
            >
              <div
                contentEditable={editing}
                suppressContentEditableWarning
                onBlur={(e) => {
                  setEditingId(null);
                  const text = e.currentTarget.innerText;
                  // Persist the wrapped height back to the model so overlap /
                  // safe-area checks see the true box, and a reload keeps it.
                  const stageEl = ref.current;
                  const boxEl = e.currentTarget.parentElement;
                  let nextHeight: number | null = null;
                  if (stageEl && boxEl) {
                    const sh = stageEl.getBoundingClientRect().height;
                    const bh = boxEl.getBoundingClientRect().height;
                    if (sh > 0) nextHeight = clamp(bh / sh, 0.03, 1);
                  }
                  onChange(
                    elements.map((x) =>
                      x.id === el.id
                        ? { ...x, content: text, size: nextHeight != null ? { ...x.size, height: nextHeight } : x.size }
                        : x,
                    ),
                  );
                  onCommit();
                }}
                style={{
                  width: '100%', height: 'auto', outline: 'none', cursor: editing ? 'text' : 'inherit',
                  color: (s.color as string) ?? '#fff',
                  fontFamily: `${(s.fontFamily as string) ?? 'Inter'}, sans-serif`,
                  fontWeight: (s.fontWeight as string) ?? '600',
                  fontStyle: (s.fontStyle as string) ?? 'normal',
                  fontSize: `${((s.fontSize as number) ?? 0.05) * 100}cqi`,
                  textAlign: ((s.align as 'left' | 'center' | 'right') ?? 'left'),
                  lineHeight: String((s.lineHeight as number) ?? 1.2),
                  // Honour manual line breaks (\n) in the preview the way the
                  // canvas export already does, instead of collapsing them.
                  whiteSpace: 'pre-wrap',
                  overflow: 'visible',
                }}
              >
                {el.content}
              </div>
              {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
              {selected && onDelete && <DeleteHandle onClick={() => onDelete(el.id)} />}
            </div>
          );
        }
        if (el.type === 'shape') {
          return (
            <div key={el.id} className={`${common} ${ring}`} style={{ ...box, background: (s.fill as string) ?? '#6366f1', borderRadius: `${((s.radius as number) ?? 0) * 100}cqi` }} onPointerDown={(e) => startDrag(e, el, 'move')}>
              {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
              {selected && onDelete && <DeleteHandle onClick={() => onDelete(el.id)} />}
            </div>
          );
        }
        // image / logo
        return (
          <div key={el.id} className={`${common} ${ring}`} style={box} onPointerDown={(e) => startDrag(e, el, 'move')}>
            <img src={el.content} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: ((s.fit as 'cover' | 'contain') ?? 'contain'), borderRadius: `${((s.radius as number) ?? 0) * 100}cqi`, pointerEvents: 'none' }} />
            {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
            {selected && onDelete && <DeleteHandle onClick={() => onDelete(el.id)} />}
          </div>
        );
      })}

      {showSafe && safeInsets && (
        <div className="pointer-events-none absolute border border-dashed border-emerald-400/70" style={{ top: safeInsets.top, bottom: safeInsets.bottom, left: safeInsets.left, right: safeInsets.right }} />
      )}
    </div>
  );
}

function ResizeHandle({ onDown }: { onDown: (e: React.PointerEvent) => void }) {
  return (
    <span
      onPointerDown={onDown}
      // Larger, touch-friendlier hit target than the visual dot (the padding
      // extends the tappable area on coarse pointers).
      className="absolute -bottom-2.5 -right-2.5 grid h-6 w-6 cursor-nwse-resize place-items-center"
    >
      <span className="block h-3.5 w-3.5 rounded-full border-2 border-violet-500 bg-white dark:bg-zinc-900" />
    </span>
  );
}

// Bin control at the top-right of the selected element's box (Canva-style).
// stopPropagation on pointerdown so it deletes instead of starting a drag.
function DeleteHandle({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      title="Delete"
      aria-label="Delete element"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute -top-2.5 -right-2.5 grid h-6 w-6 place-items-center rounded-full border-2 border-violet-500 bg-white text-zinc-600 shadow-sm transition-colors hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-red-950/40"
    >
      <Trash2 size={12} />
    </button>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
