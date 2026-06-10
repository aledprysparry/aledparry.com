import { useEffect, useRef, useState } from 'react';
import type { GraphicElement } from '@engine/lib/model/types';

interface Props {
  elements: GraphicElement[];
  width: number; // canvas px (for aspect + font scaling)
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: GraphicElement[]) => void; // live (during drag)
  onCommit: () => void; // persist (drag end / edit end)
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
};

export default function Stage({ elements, width, height, selectedId, onSelect, onChange, onCommit, showSafe, safeInsets }: Props) {
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
    drag.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, startPos: { ...el.position }, startSize: { ...el.size } };
  };

  return (
    <div
      ref={ref}
      onPointerDown={() => onSelect(null)}
      className="relative w-full select-none overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50"
      style={{ aspectRatio: `${width} / ${height}` }}
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
          return <div key={el.id} style={{ ...box, left: 0, top: 0, background: (s.fill as string) ?? '#0c1322' }} onPointerDown={(e) => { e.stopPropagation(); onSelect(el.id); }} />;
        }
        const common = 'absolute cursor-move';
        const ring = selected ? 'outline outline-2 outline-indigo-400' : 'hover:outline hover:outline-1 hover:outline-white/30';
        if (el.type === 'text') {
          const editing = editingId === el.id;
          return (
            <div
              key={el.id}
              className={`${common} ${ring}`}
              style={box}
              onPointerDown={(e) => startDrag(e, el, 'move')}
              onDoubleClick={() => { onSelect(el.id); setEditingId(el.id); }}
            >
              <div
                contentEditable={editing}
                suppressContentEditableWarning
                onBlur={(e) => {
                  setEditingId(null);
                  const text = e.currentTarget.innerText;
                  onChange(elements.map((x) => (x.id === el.id ? { ...x, content: text } : x)));
                  onCommit();
                }}
                style={{
                  width: '100%', height: '100%', outline: 'none', cursor: editing ? 'text' : 'inherit',
                  color: (s.color as string) ?? '#fff',
                  fontFamily: `${(s.fontFamily as string) ?? 'Inter'}, sans-serif`,
                  fontWeight: (s.fontWeight as string) ?? '600',
                  fontSize: `${((s.fontSize as number) ?? 0.05) * width}px`,
                  textAlign: ((s.align as 'left' | 'center' | 'right') ?? 'left'),
                  lineHeight: String((s.lineHeight as number) ?? 1.2),
                  overflow: 'visible',
                }}
              >
                {el.content}
              </div>
              {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
            </div>
          );
        }
        if (el.type === 'shape') {
          return (
            <div key={el.id} className={`${common} ${ring}`} style={{ ...box, background: (s.fill as string) ?? '#6366f1', borderRadius: `${((s.radius as number) ?? 0) * width}px` }} onPointerDown={(e) => startDrag(e, el, 'move')}>
              {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
            </div>
          );
        }
        // image / logo
        return (
          <div key={el.id} className={`${common} ${ring}`} style={box} onPointerDown={(e) => startDrag(e, el, 'move')}>
            <img src={el.content} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: ((s.fit as 'cover' | 'contain') ?? 'contain'), borderRadius: `${((s.radius as number) ?? 0) * width}px`, pointerEvents: 'none' }} />
            {selected && <ResizeHandle onDown={(e) => startDrag(e, el, 'resize')} />}
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
      className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-indigo-400 bg-white"
    />
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
