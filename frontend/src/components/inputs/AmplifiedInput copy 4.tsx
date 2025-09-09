// src/components/inputs/AmplifiedInput.tsx (lean, same behavior)
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

/**
 * Small utilities
 */
// Merge multiple refs (object or callback) into one
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

// Mobile detection via media query
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    update(mql);
    mql.addEventListener?.('change', update as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener?.('change', update as (e: MediaQueryListEvent) => void);
  }, [breakpoint]);
  return isMobile;
}

// Open intent is either preview-on-hover or editing-by-focus
type Intent = 'idle' | 'hover' | 'focus';

// Unified handlers for input/textarea
type UnifiedHandlers = {
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

export type AmplifiedInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'onChange' | 'onBlur' | 'onKeyDown' | 'value'
> &
  UnifiedHandlers & { label?: string; value: string };

/**
 * Controller hook that centralizes open state & cross-instance exclusivity.
 */
function useAmplifiedController(onBlur?: UnifiedHandlers['onBlur']) {
  const [open, setOpen] = React.useState(false);
  const [intent, setIntent] = React.useState<Intent>('idle');
  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const hoverTimer = React.useRef<number | null>(null);
  const closing = React.useRef(false);
  const skipNextOuterClose = React.useRef(false);
  const id = React.useRef(Symbol('amplified-input'));

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const close = React.useCallback(() => {
    closing.current = true;
    clearHoverTimer();
    setOpen(false);
    setActive(false);
    if (intent === 'focus' && onBlur) onBlur({} as React.FocusEvent<HTMLInputElement>);
    setIntent('idle');
    window.setTimeout(() => (closing.current = false), 120);
  }, [intent, onBlur]);

  const openByFocus = React.useCallback(() => {
    if (closing.current) return;
    clearHoverTimer();
    setIntent('focus');
    setActive(true);
    setOpen(true);
    window.dispatchEvent(new CustomEvent('amplified:open', { detail: { id: id.current } }));
  }, []);

  const openByHover = React.useCallback(() => {
    clearHoverTimer();
    setIntent('hover');
    hoverTimer.current = window.setTimeout(() => {
      setOpen(true);
      window.dispatchEvent(new CustomEvent('amplified:open', { detail: { id: id.current } }));
    }, 80);
  }, []);

  const closeHover = React.useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => intent === 'hover' && setOpen(false), 120);
  }, [intent]);

  // Exclusivity: ensure only one instance is open at a time
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: symbol } | undefined;
      if (!detail || detail.id === id.current) return;
      if (open) close();
    };
    window.addEventListener('amplified:open', handler as EventListener);
    return () => window.removeEventListener('amplified:open', handler as EventListener);
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
}

/**
 * AmplifiedInput
 * - Desktop: Input trigger + Popover editor (hover=preview, focus=edit)
 * - Mobile: Single auto-growing Textarea
 */
export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, label, ...rest }, ref) => {
    const isMobile = useIsMobile();
    const ctrl = useAmplifiedController(onBlur);

    const triggerRef = React.useRef<HTMLInputElement | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Focus textarea when editing starts
    React.useEffect(() => {
      if (ctrl.intent === 'focus' && ctrl.open) {
        const t = window.setTimeout(() => editorRef.current?.focus(), 0);
        return () => window.clearTimeout(t);
      }
    }, [ctrl.intent, ctrl.open]);

    // Common handlers
    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (!(ctrl.open && ctrl.intent === 'focus')) ctrl.setActive(false);
    };
    const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) ctrl.setActive(false);
      onKeyDown?.(e);
    };

    const onAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const onAreaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const onAreaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        ctrl.close();
        return;
      }
      onKeyDown?.(e);
    };

    // --- Desktop ---
    const Desktop = (
      <Popover
        open={ctrl.open}
        onOpenChange={(next) => {
          if (!next) {
            if (ctrl.skipNextOuterClose.current) {
              ctrl.skipNextOuterClose.current = false;
              ctrl.setOpen(true);
              ctrl.setIntent('focus');
              ctrl.setActive(true);
              setTimeout(() => editorRef.current?.focus(), 0);
            } else {
              ctrl.close();
            }
          } else {
            ctrl.setOpen(true);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Input
            ref={mergeRefs<HTMLInputElement>(triggerRef, ref)}
            value={value}
            onChange={onInputChange}
            onBlur={onInputBlur}
            onKeyDown={onInputKeyDown}
            onFocus={(e) => {
              ctrl.openByFocus();
              rest.onFocus?.(e);
            }}
            onClick={() => ctrl.openByFocus()}
            onPointerDownCapture={(e) => {
              if (!isMobile && ctrl.open) {
                ctrl.skipNextOuterClose.current = true;
                e.preventDefault();
                ctrl.setIntent('focus');
                ctrl.setActive(true);
                ctrl.setOpen(true);
                setTimeout(() => editorRef.current?.focus(), 0);
              }
            }}
            onMouseEnter={() => {
              if (!isMobile) {
                ctrl.setHovered(true);
                ctrl.openByHover();
              }
            }}
            onMouseLeave={() => {
              if (!isMobile) {
                ctrl.setHovered(false);
                if (ctrl.intent === 'hover') ctrl.closeHover();
              }
            }}
            placeholder={placeholder}
            className={[
              'text-left',
              className ?? '',
              ctrl.hovered || ctrl.active
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
            if (ctrl.intent === 'focus') setTimeout(() => editorRef.current?.focus(), 0);
          }}
          onInteractOutside={(e) => {
            if (
              triggerRef.current &&
              e.target instanceof Node &&
              triggerRef.current.contains(e.target)
            ) {
              e.preventDefault();
              if (!isMobile) {
                ctrl.setIntent('focus');
                ctrl.setActive(true);
                ctrl.setOpen(true);
                setTimeout(() => editorRef.current?.focus(), 0);
              }
            }
          }}
          onMouseEnter={() => {
            if (ctrl.intent === 'hover') ctrl.setOpen(true);
          }}
          onMouseLeave={() => {
            if (ctrl.intent === 'hover') ctrl.closeHover();
          }}
        >
          {/* Close button */}
          <button
            type='button'
            aria-label='Close'
            onClick={(e) => {
              e.stopPropagation();
              ctrl.close();
            }}
            className='absolute top-2 right-2 p-1 rounded hover:bg-muted focus:outline-none'
          >
            <X className='h-4 w-4' />
          </button>

          {label ? (
            <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
              {label}
            </div>
          ) : null}

          <Textarea
            ref={editorRef}
            readOnly={ctrl.intent === 'hover'}
            autoFocus={ctrl.intent === 'focus'}
            value={value ?? ''}
            onChange={onAreaChange}
            onBlur={onAreaBlur}
            onKeyDown={onAreaKeyDown}
            placeholder={placeholder}
            className='min-h-28 md:min-h-32 h-auto text-left text-base leading-relaxed whitespace-pre-wrap break-words resize-none'
            onClick={() => ctrl.intent === 'hover' && ctrl.setIntent('focus')}
          />
        </PopoverContent>
      </Popover>
    );

    // --- Mobile ---
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
        value={value ?? ''}
        onChange={(e) => {
          autoSize(e.currentTarget);
          onAreaChange(e);
        }}
        onInput={(e) => autoSize(e.currentTarget as HTMLTextAreaElement)}
        onFocus={(e) => {
          ctrl.setActive(true);
          rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          ctrl.setActive(false);
          onAreaBlur(e);
        }}
        onKeyDown={(e) => onAreaKeyDown(e)}
        placeholder={placeholder}
        className={[
          'w-full min-h-12 px-3 py-2 rounded-md text-left text-base leading-relaxed whitespace-pre-wrap break-words resize-none',
          ctrl.active
            ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow'
            : 'transition-shadow',
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
