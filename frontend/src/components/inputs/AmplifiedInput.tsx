// src/components/inputs/AmplifiedInput.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
//import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X } from 'lucide-react';

// Detect mobile by media query
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

export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, label, ...rest }, ref) => {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);
    const [intent, setIntent] = React.useState<OpenIntent>('idle');
    const [hovered, setHovered] = React.useState(false);
    const [active, setActive] = React.useState(false); // keep highlight while editing
    const hoverTimer = React.useRef<number | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
      // Focus textarea when entering edit mode (desktop popover)
      if (intent === 'focus' && open) {
        setTimeout(() => editorRef.current?.focus(), 0);
      }
    }, [intent, open]);

    // Open/close helpers
    const openByHover = () => {
      setIntent('hover');
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => setOpen(true), 80);
    };
    const closeHover = () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => {
        if (intent === 'hover') setOpen(false);
      }, 120);
    };
    const openByFocus = () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      setIntent('focus');
      setOpen(true);
      setActive(true);
    };
    const handleClose = () => {
      setOpen(false);
      setActive(false);
      if (intent === 'focus' && onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
      }
      setIntent('idle');
    };

    // Base input wrappers
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const handleBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (!(open && intent === 'focus')) {
        setActive(false);
      }
    };
    const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        setActive(false);
      }
      onKeyDown?.(e);
    };

    // Textarea wrappers
    const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const handleBlurTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Desktop editor: Enter without Shift cierra editor
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        handleClose();
        return;
      }
      onKeyDown?.(e);
    };

    // ====== Desktop (Popover) ======
    const DesktopAmplified = (
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (!o) handleClose();
          else setOpen(true);
        }}
      >
        <PopoverTrigger asChild>
          <Input
            ref={ref}
            value={value}
            onChange={handleChangeInput}
            onBlur={handleBlurInput}
            onKeyDown={handleKeyDownInput}
            onFocus={(e) => {
              openByFocus();
              rest.onFocus?.(e);
            }}
            onClick={() => openByFocus()}
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
          {/* Close */}
          <button
            type='button'
            aria-label='Close'
            onClick={handleClose}
            className='absolute top-2 right-2 p-1 rounded hover:bg-muted'
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

    // ====== Mobile (Single auto-growing Textarea) ======
    // Auto-resize helper
    const mobileAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const autoSize = (el: HTMLTextAreaElement) => {
      // Reset height to compute new scrollHeight
      el.style.height = 'auto';
      // Cap height to avoid infinite growth (responsivo)
      const maxPx = Math.round(window.innerHeight * 0.6); // ~60vh
      const next = Math.min(el.scrollHeight, maxPx);
      el.style.height = `${next}px`;
    };

    // Keep textarea height in sync with value & viewport changes
    React.useLayoutEffect(() => {
      if (isMobile && mobileAreaRef.current) {
        autoSize(mobileAreaRef.current);
      }
    }, [isMobile, value]);

    React.useEffect(() => {
      // Recalculate on rotations or size changes
      const onResize = () => {
        if (isMobile && mobileAreaRef.current) autoSize(mobileAreaRef.current);
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, [isMobile]);

    const MobileAmplified = (
      <>
        {/* Note: On mobile there is only one Textarea that grows with the lines */}
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
            // No preview: the textarea is the editor
            rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
          }}
          onBlur={(e) => {
            setActive(false);
            handleBlurTextarea(e);
          }}
          onKeyDown={(e) => {
            // On mobile, Enter inserts a new line by default (grows with content)
            handleKeyDownTextarea(e);
          }}
          placeholder={placeholder}
          className={[
            'w-full text-base leading-relaxed whitespace-pre-wrap break-words resize-none',
            // Reasonable minimum heights on mobile
            'min-h-12 px-3 py-2 rounded-md',
            active ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow' : 'transition-shadow',
            className ?? '',
          ].join(' ')}
          // Ensures that the content wraps and does not overflow
          style={{
            overflow: 'hidden',
          }}
          aria-label={label ?? placeholder}
        />
      </>
    );

    return isMobile ? MobileAmplified : DesktopAmplified;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
