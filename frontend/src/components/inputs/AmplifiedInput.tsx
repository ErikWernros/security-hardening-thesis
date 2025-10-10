// src/components/inputs/AmplifiedInput.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

type Intent = 'idle' | 'hover' | 'focus';

type UnifiedHandlers = {
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export type AmplifiedInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'onChange' | 'onBlur' | 'onKeyDown' | 'value'
> &
  UnifiedHandlers & {
    label?: string;
    value: string;
    /** Delay (ms) para abrir por hover en Desktop. (default: 80) */
    hoverDelayMs?: number;
  };

/* ---------- Small utilities (no MutableRefObject / no any) ---------- */
type AssignableRef<T> = ((instance: T | null) => void) | { current: T | null } | null | undefined;

const composeRefs =
  <T,>(...refs: AssignableRef<T>[]) =>
  (node: T | null) => {
    for (const r of refs) {
      if (!r) continue;
      if (typeof r === 'function') r(node);
      else r.current = node;
    }
  };

const useIsMobile = (bp = 768) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const handle = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // Initial
    setIsMobile(mq.matches);

    // Modern browsers
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handle);
      return () => mq.removeEventListener('change', handle);
    }

    // Fallback (old Safari)
    // @ts-expect-error: addListener exists in older DOM lib
    mq.addListener(handle);
    return () => {
      // @ts-expect-error: removeListener exists in older DOM lib
      mq.removeListener(handle);
    };
  }, [bp]);

  return isMobile;
};

/* ---------- Lightweight controller ---------- */
const useCtrl = (
  onBlur?: UnifiedHandlers['onBlur'],
  hoverDelayMs: number = 80, // default idéntico al original
) => {
  const [open, setOpen] = React.useState(false);
  const [intent, setIntent] = React.useState<Intent>('idle');
  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const id = React.useRef(Symbol('amplified-input'));
  const hoverTimeout = React.useRef<number | null>(null);
  const closing = React.useRef(false);
  const skipNextOuterClose = React.useRef(false);

  const clearHover = () => {
    if (hoverTimeout.current !== null) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  };

  const close = React.useCallback((): void => {
    closing.current = true;
    clearHover();
    setOpen(false);
    setActive(false);
    if (intent === 'focus' && onBlur) {
      // Notify consumer blur when closing from focus-intent
      onBlur({} as React.FocusEvent<HTMLInputElement>);
    }
    setIntent('idle');
    window.setTimeout(() => {
      closing.current = false;
    }, 120);
  }, [intent, onBlur]);

  const openByFocus = React.useCallback((): void => {
    if (closing.current) return;
    clearHover();
    setIntent('focus');
    setActive(true);
    setOpen(true);
    window.dispatchEvent(
      new CustomEvent<{ id: symbol }>('amplified:open', { detail: { id: id.current } }),
    );
  }, []);

  const openByHover = React.useCallback((): void => {
    clearHover();
    hoverTimeout.current = window.setTimeout(() => {
      setOpen(true);
      window.dispatchEvent(
        new CustomEvent<{ id: symbol }>('amplified:open', { detail: { id: id.current } }),
      );
    }, hoverDelayMs);
  }, [hoverDelayMs]);

  const closeHover = React.useCallback((): void => {
    clearHover();
    hoverTimeout.current = window.setTimeout(() => {
      if (intent === 'hover') setOpen(false);
    }, 120);
  }, [intent]);

  // Ensure only one instance is open at a time
  React.useEffect(() => {
    const handleOpened = (e: Event) => {
      const detail = (e as CustomEvent<{ id: symbol }>).detail;
      if (detail && detail.id !== id.current && open) {
        close();
      }
    };
    window.addEventListener('amplified:open', handleOpened as EventListener);
    return () => window.removeEventListener('amplified:open', handleOpened as EventListener);
  }, [open, close]);

  return {
    open,
    intent,
    active,
    hovered,
    setHovered,
    setActive,
    setOpen,
    setIntent,
    openByFocus,
    openByHover,
    closeHover,
    close,
    skipNextOuterClose,
  } as const;
};

/* ---------- Component ---------- */
export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  (
    { value, onChange, onBlur, onKeyDown, placeholder, className, label, hoverDelayMs, ...rest },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const delay = typeof hoverDelayMs === 'number' ? hoverDelayMs : 80; // default sin cambiar comportamiento
    const c = useCtrl(onBlur, delay);

    const triggerRef = React.useRef<HTMLInputElement | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Focus textarea when entering edit mode via focus
    React.useEffect(() => {
      if (c.intent === 'focus' && c.open) {
        const t = window.setTimeout(() => editorRef.current?.focus(), 0);
        return () => window.clearTimeout(t);
      }
      return;
    }, [c.intent, c.open]);

    // Handlers (unificados, sin cambio de comportamiento)
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (!(c.open && c.intent === 'focus')) c.setActive(false);
    };
    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) c.setActive(false);
      onKeyDown?.(e);
    };

    const onAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const onAreaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const onAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        c.close();
        return;
      }
      onKeyDown?.(e);
    };

    /* ----- Desktop: Input + Popover ----- */
    const Desktop = (
      <Popover
        open={c.open}
        onOpenChange={(next) => {
          if (!next) {
            if (c.skipNextOuterClose.current) {
              // Ignora un cierre inmediatamente posterior al click del trigger.
              c.skipNextOuterClose.current = false;
              c.setOpen(true);
              c.setIntent('focus');
              c.setActive(true);
              window.setTimeout(() => editorRef.current?.focus(), 0);
            } else {
              c.close();
            }
          } else {
            c.setOpen(true);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Input
            ref={composeRefs<HTMLInputElement>(ref as AssignableRef<HTMLInputElement>, (node) => {
              triggerRef.current = node;
            })}
            value={value}
            onChange={onInputChange}
            onBlur={onInputBlur}
            onKeyDown={onInputKeyDown}
            onFocus={(e) => {
              c.openByFocus();
              rest.onFocus?.(e);
            }}
            onClick={() => c.openByFocus()}
            onPointerDownCapture={(e) => {
              if (!isMobile) {
                // 🟢 Clave: marcar el click del trigger SIEMPRE (también cuando está cerrado),
                // para ignorar el cierre inmediato que hace Radix al re-procesar el pointer down.
                c.skipNextOuterClose.current = true;

                if (c.open) {
                  e.preventDefault();
                  c.setIntent('focus');
                  c.setActive(true);
                  c.setOpen(true);
                  window.setTimeout(() => editorRef.current?.focus(), 0);
                }
              }
            }}
            onMouseEnter={() => {
              if (!isMobile) {
                c.setHovered(true);
                c.openByHover(); // usa el delay configurado (hoverDelayMs)
              }
            }}
            onMouseLeave={() => {
              if (!isMobile) {
                c.setHovered(false);
                if (c.intent === 'hover') c.closeHover();
              }
            }}
            placeholder={placeholder}
            className={[
              'text-left',
              className ?? '',
              c.hovered || c.active
                ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow'
                : 'transition-shadow',
            ].join(' ')}
            {...rest}
          />
        </PopoverTrigger>

        <PopoverContent
          align='center'
          side='bottom'
          sideOffset={8}
          className='relative w-[min(92vw,420px)] p-4 pt-8 space-y-3'
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            if (c.intent === 'focus') window.setTimeout(() => editorRef.current?.focus(), 0);
          }}
          onInteractOutside={(e) => {
            // Keep open if interaction comes from the trigger
            const target = e.target as EventTarget | null;
            if (
              target &&
              triggerRef.current &&
              target instanceof Node &&
              triggerRef.current.contains(target)
            ) {
              e.preventDefault();
              if (!isMobile) {
                c.setIntent('focus');
                c.setActive(true);
                c.setOpen(true);
                window.setTimeout(() => editorRef.current?.focus(), 0);
              }
            }
          }}
          onMouseEnter={() => {
            if (c.intent === 'hover') c.setOpen(true);
          }}
          onMouseLeave={() => {
            if (c.intent === 'hover') c.closeHover();
          }}
        >
          {/* Close button */}
          <button
            type='button'
            aria-label='Close'
            onClick={(e) => {
              e.stopPropagation();
              c.close();
            }}
            className='absolute top-2 right-2 p-1 rounded hover:bg-muted focus:outline-none'
          >
            <X className='h-4 w-4' />
          </button>

          {label && (
            <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              {label}
            </div>
          )}

          <Textarea
            ref={editorRef}
            readOnly={c.intent === 'hover'}
            autoFocus={c.intent === 'focus'}
            value={value}
            onChange={onAreaChange}
            onBlur={onAreaBlur}
            onKeyDown={onAreaKeyDown}
            placeholder={placeholder}
            className='min-h-28 md:min-h-32 h-auto text-left text-base leading-relaxed whitespace-pre-wrap break-words resize-none'
            onClick={() => {
              if (c.intent === 'hover') c.setIntent('focus');
            }}
          />
        </PopoverContent>
      </Popover>
    );

    /* ----- Mobile: single autosizing Textarea ----- */
    const mobileRef = React.useRef<HTMLTextAreaElement | null>(null);

    const autoSize = React.useCallback((el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      const maxPx = Math.round(window.innerHeight * 0.6);
      el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
    }, []);

    React.useLayoutEffect(() => {
      if (isMobile && mobileRef.current) autoSize(mobileRef.current);
    }, [isMobile, value, autoSize]);

    React.useEffect(() => {
      const onResize = () => {
        if (isMobile && mobileRef.current) autoSize(mobileRef.current);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [isMobile, autoSize]);

    const Mobile = (
      <Textarea
        ref={mobileRef}
        value={value}
        onChange={(e) => {
          autoSize(e.currentTarget);
          onAreaChange(e);
        }}
        onInput={(e) => autoSize(e.currentTarget as HTMLTextAreaElement)}
        onFocus={(e) => {
          c.setActive(true);
          // Keeping consumer onFocus behavior; cast is safe for consumers expecting input focus.
          rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          c.setActive(false);
          onAreaBlur(e);
        }}
        onKeyDown={(e) => onAreaKeyDown(e)}
        placeholder={placeholder}
        className={[
          'w-full min-h-12 px-3 py-2 rounded-md text-left text-base leading-relaxed whitespace-pre-wrap break-words resize-none',
          c.active ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow' : 'transition-shadow',
          className ?? '',
        ].join(' ')}
        style={{ overflow: 'hidden' }}
        aria-label={label ?? placeholder}
      />
    );

    return isMobile ? Mobile : Desktop;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
