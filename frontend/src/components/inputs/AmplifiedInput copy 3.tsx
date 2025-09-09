// src/components/inputs/AmplifiedInput.tsx (simplified, same behavior)
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

/** Merge multiple refs (supports both callback and object refs) */
type AssignableRef<T> = React.Ref<T> | { current: T | null } | undefined;
const setRef = <T,>(ref: AssignableRef<T>, value: T | null) => {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as { current: T | null }).current = value;
};
const mergeRefs =
  <T,>(...refs: AssignableRef<T>[]) =>
  (value: T | null) =>
    refs.forEach((r) => setRef(r, value));

/** Detect mobile viewport via media query */
function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    handler(mql);
    mql.addEventListener?.('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener?.('change', handler as (e: MediaQueryListEvent) => void);
  }, [breakpoint]);
  return isMobile;
}

type OpenIntent = 'idle' | 'hover' | 'focus';

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
  };

/** Consolidated controller for open state, timers, and cross-instance coordination */
function useAmplifiedController(onBlur?: UnifiedHandlers['onBlur']) {
  const [open, setOpen] = React.useState(false);
  const [intent, setIntent] = React.useState<OpenIntent>('idle');
  const [active, setActive] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const hoverTimer = React.useRef<number | null>(null);
  const closingRef = React.useRef(false);
  const suppressNextCloseRef = React.useRef(false);
  const instanceIdRef = React.useRef(Symbol('amplified-input'));

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const close = React.useCallback(() => {
    closingRef.current = true;
    clearHoverTimer();
    setOpen(false);
    setActive(false);
    if (intent === 'focus' && onBlur) onBlur({} as React.FocusEvent<HTMLInputElement>);
    setIntent('idle');
    window.setTimeout(() => {
      closingRef.current = false;
    }, 150);
  }, [intent, onBlur]);

  const openByHover = React.useCallback(() => {
    setIntent('hover');
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      setOpen(true);
      window.dispatchEvent(
        new CustomEvent('amplified:hover-open', { detail: { id: instanceIdRef.current } }),
      );
    }, 80);
  }, []);

  const closeHover = React.useCallback(() => {
    clearHoverTimer();
    hoverTimer.current = window.setTimeout(() => {
      if (intent === 'hover') setOpen(false);
    }, 120);
  }, [intent]);

  const openByFocus = React.useCallback(() => {
    if (closingRef.current) return;
    clearHoverTimer();
    setIntent('focus');
    setOpen(true);
    setActive(true);
    window.dispatchEvent(
      new CustomEvent('amplified:focus-open', { detail: { id: instanceIdRef.current } }),
    );
  }, []);

  // Only one instance open at a time
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const closeIfOtherOpened = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: symbol } | undefined;
      if (!detail || detail.id === instanceIdRef.current) return;
      clearHoverTimer();
      if (open) close();
    };

    window.addEventListener('amplified:focus-open', closeIfOtherOpened as EventListener);
    window.addEventListener('amplified:hover-open', closeIfOtherOpened as EventListener);
    return () => {
      window.removeEventListener('amplified:focus-open', closeIfOtherOpened as EventListener);
      window.removeEventListener('amplified:hover-open', closeIfOtherOpened as EventListener);
    };
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
    openByHover,
    openByFocus,
    closeHover,
    close,
    suppressNextCloseRef,
  } as const;
}

/** AmplifiedInput
 *  - Desktop: Input (trigger) + Popover with Textarea (hover = preview, click/focus = edit)
 *  - Mobile: Single auto-growing Textarea
 *  - Global: Only one instance remains open at a time
 */
export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, label, ...rest }, externalRef) => {
    const isMobile = useIsMobile();
    const ctrl = useAmplifiedController(onBlur);

    const triggerRef = React.useRef<HTMLInputElement | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Focus textarea when entering edit mode
    React.useEffect(() => {
      if (ctrl.intent === 'focus' && ctrl.open) {
        const id = window.setTimeout(() => editorRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
      }
    }, [ctrl.intent, ctrl.open]);

    // Shared handlers
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const handleBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (!(ctrl.open && ctrl.intent === 'focus')) ctrl.setActive(false);
    };
    const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) ctrl.setActive(false);
      onKeyDown?.(e);
    };

    const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const handleBlurTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        ctrl.close();
        return;
      }
      onKeyDown?.(e);
    };

    // --- Desktop (Popover) -------------------------------------------------
    const DesktopAmplified = (
      <Popover
        open={ctrl.open}
        onOpenChange={(next) => {
          if (!next) {
            if (ctrl.suppressNextCloseRef.current) {
              ctrl.suppressNextCloseRef.current = false;
              ctrl.setOpen(true);
              ctrl.setIntent('focus');
              ctrl.setActive(true);
              setTimeout(() => editorRef.current?.focus(), 0);
              return;
            }
            ctrl.close();
          } else {
            ctrl.setOpen(true);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Input
            ref={mergeRefs<HTMLInputElement>(triggerRef, externalRef)}
            value={value}
            onChange={handleChangeInput}
            onBlur={handleBlurInput}
            onKeyDown={handleKeyDownInput}
            onFocus={(e) => {
              ctrl.openByFocus();
              rest.onFocus?.(e);
            }}
            onClick={() => ctrl.openByFocus()}
            // When already open, convert trigger click into edit instead of closing
            onPointerDownCapture={(e) => {
              if (!isMobile && ctrl.open) {
                ctrl.suppressNextCloseRef.current = true;
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
            if (ctrl.intent === 'hover') {
              ctrl.setOpen(true);
            }
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
            className='absolute top-2 right-2 p-1 rounded hover:bg-muted focus:outline-none focus:ring-0 active:outline-none'
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
            onChange={handleChangeTextarea}
            onBlur={handleBlurTextarea}
            onKeyDown={handleKeyDownTextarea}
            placeholder={placeholder}
            className='
              text-left
              min-h-28 md:min-h-32 h-auto text-base leading-relaxed
              whitespace-pre-wrap break-words resize-none
            '
            onClick={() => {
              if (ctrl.intent === 'hover') ctrl.setIntent('focus');
            }}
          />
        </PopoverContent>
      </Popover>
    );

    // --- Mobile (single auto-growing Textarea) -----------------------------
    const mobileAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const autoSize = React.useCallback((el: HTMLTextAreaElement) => {
      el.style.height = 'auto';
      const maxPx = Math.round(window.innerHeight * 0.6); // ~60vh
      el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
    }, []);

    React.useLayoutEffect(() => {
      if (isMobile && mobileAreaRef.current) autoSize(mobileAreaRef.current);
    }, [isMobile, value, autoSize]);

    React.useEffect(() => {
      const onResize = () => {
        if (isMobile && mobileAreaRef.current) autoSize(mobileAreaRef.current);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [isMobile, autoSize]);

    const MobileAmplified = (
      <Textarea
        ref={mobileAreaRef}
        value={value ?? ''}
        onChange={(e) => {
          autoSize(e.currentTarget);
          handleChangeTextarea(e);
        }}
        onInput={(e) => autoSize(e.currentTarget as HTMLTextAreaElement)}
        onFocus={(e) => {
          ctrl.setActive(true);
          rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          ctrl.setActive(false);
          handleBlurTextarea(e);
        }}
        onKeyDown={(e) => {
          // On mobile, Enter inserts a newline and grows the textarea
          handleKeyDownTextarea(e);
        }}
        placeholder={placeholder}
        className={[
          'text-left',
          'w-full text-base leading-relaxed whitespace-pre-wrap break-words resize-none',
          'min-h-12 px-3 py-2 rounded-md',
          ctrl.active
            ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow'
            : 'transition-shadow',
          className ?? '',
        ].join(' ')}
        style={{ overflow: 'hidden' }}
        aria-label={label ?? placeholder}
      />
    );

    return isMobile ? MobileAmplified : DesktopAmplified;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
