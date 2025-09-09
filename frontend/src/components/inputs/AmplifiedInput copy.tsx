// src/components/inputs/AmplifiedInput.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

/** Merge multiple refs (supports callback refs and object refs) without using MutableRefObject */
type AssignableRef<T> = React.Ref<T> | { current: T | null } | undefined;
function setRef<T>(ref: AssignableRef<T>, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as { current: T | null }).current = value; // structural typing to avoid readonly issues
}
function mergeRefs<T>(...refs: AssignableRef<T>[]) {
  return (value: T | null) => refs.forEach((r) => setRef(r, value));
}

/** Detect if viewport is mobile using a media query */
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

/** AmplifiedInput
 *  - Desktop: Input as trigger + Popover with Textarea (hover -> preview, click -> edit & focus)
 *  - Mobile: single auto-growing Textarea
 *  - Global: coordinates with other instances so only one remains open
 */
export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, label, ...rest }, externalRef) => {
    // --- State & Refs -------------------------------------------------------
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);
    const [intent, setIntent] = React.useState<OpenIntent>('idle');
    const [hovered, setHovered] = React.useState(false);
    const [active, setActive] = React.useState(false); // visual ring while editing

    const instanceIdRef = React.useRef(Symbol('amplified-input'));
    const hoverTimer = React.useRef<number | null>(null);
    const closingRef = React.useRef(false);
    const suppressNextCloseRef = React.useRef(false);

    const triggerRef = React.useRef<HTMLInputElement | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    // --- Focus textarea on enter edit mode (desktop) ------------------------
    React.useEffect(() => {
      if (intent === 'focus' && open) {
        const id = window.setTimeout(() => editorRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
      }
    }, [intent, open]);

    // --- Handlers (extracted to keep render minimal) ------------------------
    /** Close popover and reset state (memoized for effects) */
    const handleClose = React.useCallback(() => {
      closingRef.current = true;

      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }

      setOpen(false);
      setActive(false);

      // Fire consumer onBlur when leaving edit mode
      if (intent === 'focus' && onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
      }
      setIntent('idle');

      // Allow focus events to settle
      window.setTimeout(() => {
        closingRef.current = false;
      }, 150);
    }, [intent, onBlur]);

    /** Open by hover (preview), notify others */
    const openByHover = React.useCallback(() => {
      setIntent('hover');
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => {
        setOpen(true);
        window.dispatchEvent(
          new CustomEvent('amplified:hover-open', { detail: { id: instanceIdRef.current } }),
        );
      }, 80);
    }, []);

    /** Graceful hover leave (only if still in hover mode) */
    const closeHover = React.useCallback(() => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => {
        if (intent === 'hover') setOpen(false);
      }, 120);
    }, [intent]);

    /** Open by focus/click (edit), notify others */
    const openByFocus = React.useCallback(() => {
      if (closingRef.current) return; // ignore immediate re-open after manual close
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      setIntent('focus');
      setOpen(true);
      setActive(true);
      window.dispatchEvent(
        new CustomEvent('amplified:focus-open', { detail: { id: instanceIdRef.current } }),
      );
    }, []);

    // --- Global coordination: only one instance should remain open ----------
    React.useEffect(() => {
      if (typeof window === 'undefined') return;

      const onFocusOpen = (e: Event) => {
        const detail = (e as CustomEvent).detail as { id: symbol } | undefined;
        if (!detail || detail.id === instanceIdRef.current) return;

        // Another instance opened by focus → always close this one
        if (hoverTimer.current) {
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
        if (open) handleClose();
      };

      const onHoverOpen = (e: Event) => {
        const detail = (e as CustomEvent).detail as { id: symbol } | undefined;
        if (!detail || detail.id === instanceIdRef.current) return;

        // Another instance opened by hover → always close this one (even if in focus)
        if (hoverTimer.current) {
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
        if (open) handleClose();
      };

      window.addEventListener('amplified:focus-open', onFocusOpen as EventListener);
      window.addEventListener('amplified:hover-open', onHoverOpen as EventListener);
      return () => {
        window.removeEventListener('amplified:focus-open', onFocusOpen as EventListener);
        window.removeEventListener('amplified:hover-open', onHoverOpen as EventListener);
      };
    }, [open, handleClose]);

    // --- Unified input/textarea handlers ------------------------------------
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const handleBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (!(open && intent === 'focus')) setActive(false);
    };
    const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) setActive(false);
      onKeyDown?.(e);
    };

    const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const handleBlurTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // On desktop, Enter without Shift closes edit mode
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        handleClose();
        return;
      }
      onKeyDown?.(e);
    };

    // --- Desktop JSX (Popover) ----------------------------------------------
    const DesktopAmplified = (
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            if (suppressNextCloseRef.current) {
              // Keep it open and switch to edit mode
              suppressNextCloseRef.current = false;
              setOpen(true);
              setIntent('focus');
              setActive(true);
              setTimeout(() => editorRef.current?.focus(), 0);
              return;
            }
            handleClose();
          } else {
            setOpen(true);
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
              openByFocus();
              rest.onFocus?.(e);
            }}
            onClick={() => openByFocus()}
            // Prevent Radix toggle-close when already open; switch to edit instead
            onPointerDownCapture={(e) => {
              if (!isMobile && open) {
                suppressNextCloseRef.current = true;
                e.preventDefault();
                setIntent('focus');
                setActive(true);
                setOpen(true);
                setTimeout(() => editorRef.current?.focus(), 0);
              }
            }}
            onMouseEnter={() => {
              if (!isMobile) {
                setHovered(true);
                openByHover();
              }
            }}
            onMouseLeave={() => {
              if (!isMobile) {
                setHovered(false);
                if (intent === 'hover') closeHover();
              }
            }}
            placeholder={placeholder}
            className={[
              'text-left',
              className ?? '',
              hovered || active
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
          // Avoid refocusing the trigger on close (prevents re-open loops)
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            if (intent === 'focus') setTimeout(() => editorRef.current?.focus(), 0);
          }}
          // If outside click was actually the trigger, don't close
          onInteractOutside={(e) => {
            if (
              triggerRef.current &&
              e.target instanceof Node &&
              triggerRef.current.contains(e.target)
            ) {
              e.preventDefault();
              if (!isMobile) {
                setIntent('focus');
                setActive(true);
                setOpen(true);
                setTimeout(() => editorRef.current?.focus(), 0);
              }
            }
          }}
          onMouseEnter={() => {
            if (intent === 'hover') {
              if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
              setOpen(true);
            }
          }}
          onMouseLeave={() => {
            if (intent === 'hover') closeHover();
          }}
        >
          {/* Close button */}
          <button
            type='button'
            aria-label='Close'
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
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
            readOnly={intent === 'hover'}
            autoFocus={intent === 'focus'}
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
              if (intent === 'hover') setIntent('focus');
            }}
          />
        </PopoverContent>
      </Popover>
    );

    // --- Mobile JSX (single auto-growing Textarea) --------------------------
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
          setActive(true);
          rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          setActive(false);
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
          active ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow' : 'transition-shadow',
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
