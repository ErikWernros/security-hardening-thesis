// src/components/inputs/AmplifiedInput.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

/** Detect mobile by media query */
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

/** AmplifiedInput con autosize en mobile y en el editor del Popover (desktop). */
export const AmplifiedInput = React.forwardRef<HTMLInputElement, AmplifiedInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className, label, ...rest }, externalRef) => {
    // --- State & Refs ---
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);
    const [intent, setIntent] = React.useState<OpenIntent>('idle');
    const [hovered, setHovered] = React.useState(false);
    const [active, setActive] = React.useState(false);

    const hoverTimer = React.useRef<number | null>(null);
    const closingRef = React.useRef(false);

    // Editor del popover (desktop)
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Focus al entrar a modo edición (desktop)
    React.useEffect(() => {
      if (intent === 'focus' && open) {
        const id = window.setTimeout(() => editorRef.current?.focus(), 0);
        return () => window.clearTimeout(id);
      }
    }, [intent, open]);

    // --- Helpers abrir/cerrar ---
    const openByHover = React.useCallback(() => {
      setIntent('hover');
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => setOpen(true), 80);
    }, []);

    const closeHover = React.useCallback(() => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      hoverTimer.current = window.setTimeout(() => {
        if (intent === 'hover') setOpen(false);
      }, 120);
    }, [intent]);

    const openByFocus = React.useCallback(() => {
      if (closingRef.current) return;
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      setIntent('focus');
      setOpen(true);
      setActive(true);
    }, []);

    const handleClose = React.useCallback(() => {
      closingRef.current = true;
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      setOpen(false);
      setActive(false);

      if (intent === 'focus' && onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
      }
      setIntent('idle');
      window.setTimeout(() => {
        closingRef.current = false;
      }, 150);
    }, [intent, onBlur]);

    // --- Wrappers de eventos unificados ---
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
      if (!isMobile && e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        handleClose();
        return;
      }
      onKeyDown?.(e);
    };

    // --- Desktop (Popover con TextareaAutosize) ---
    const DesktopAmplified = (
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) handleClose();
          else setOpen(true);
        }}
      >
        <PopoverTrigger asChild>
          <Input
            ref={externalRef}
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
          onCloseAutoFocus={(e) => e.preventDefault()}
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

          {/* Editor autosize en desktop */}
          <TextareaAutosize
            ref={editorRef}
            value={value ?? ''}
            onChange={(e) =>
              handleChangeTextarea(e as unknown as React.ChangeEvent<HTMLTextAreaElement>)
            }
            onBlur={(e) =>
              handleBlurTextarea(e as unknown as React.FocusEvent<HTMLTextAreaElement>)
            }
            onKeyDown={(e) =>
              handleKeyDownTextarea(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>)
            }
            placeholder={placeholder}
            minRows={4}
            className='
            max-h-[60vh] overflow-y-auto
              text-left
              w-full text-base leading-relaxed whitespace-pre-wrap resize-none
              min-h-28 md:min-h-32 h-auto
            '
            onClick={() => {
              if (intent === 'hover') setIntent('focus');
            }}
            // Mantener autoFocus cuando entramos por focus
            // (TextareaAutosize no tiene prop autoFocus; lo resuelve el efecto con editorRef)
          />
        </PopoverContent>
      </Popover>
    );

    // --- Mobile (TextareaAutosize simple) ---
    const mobileAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const MobileAmplified = (
      <TextareaAutosize
        ref={mobileAreaRef}
        value={value ?? ''}
        onChange={(e) => {
          onChange?.(e as unknown as React.ChangeEvent<HTMLTextAreaElement>);
        }}
        onFocus={(e) => {
          setActive(true);
          rest.onFocus?.(e as unknown as React.FocusEvent<HTMLInputElement>);
        }}
        onBlur={(e) => {
          setActive(false);
          onBlur?.(e as unknown as React.FocusEvent<HTMLTextAreaElement>);
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLTextAreaElement>);
        }}
        placeholder={placeholder}
        minRows={1}
        className={[
          'max-h-[60vh] overflow-y-auto',
          'text-left',
          'w-full text-base leading-relaxed whitespace-pre-wrap resize-none',
          'min-h-12 px-3 py-2 rounded-md',
          active ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow' : 'transition-shadow',
          className ?? '',
        ].join(' ')}
        aria-label={label ?? placeholder}
      />
    );

    return isMobile ? MobileAmplified : DesktopAmplified;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
