// src/components/inputs/AmplifiedInput.tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    const [active, setActive] = React.useState(false); // NEW: keep highlight while editing
    const hoverTimer = React.useRef<number | null>(null);
    const editorRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
      // Focus textarea when entering edit mode
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
      setActive(true); // keep base input highlighted while editor is open
    };
    const handleClose = () => {
      setOpen(false);
      setActive(false); // remove highlight when finishing edition (e.g., Enter)
      if (intent === 'focus' && onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
      }
      setIntent('idle');
    };

    // Base input wrappers
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const handleBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      // If we blurred because the textarea got focus (open + focus intent), keep highlight
      if (!(open && intent === 'focus')) {
        setActive(false);
      }
    };
    const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // If pressing Enter on the compact input, allow parent navigation
      if (e.key === 'Enter' && !e.shiftKey) {
        setActive(false); // we're moving to next field; current highlight off
      }
      onKeyDown?.(e);
    };

    // Textarea wrappers
    const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const handleBlurTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter (without Shift) -> propagate, close editor (highlight moves to next focused input)
      if (e.key === 'Enter' && !e.shiftKey) {
        onKeyDown?.(e);
        handleClose();
        return;
      }
      onKeyDown?.(e);
    };

    // Desktop (Popover)
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
              // Highlight on hover OR while active (focused/editing) — supports Enter navigation
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
          {/* Small close "x" */}
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

    // Mobile (Sheet)
    // Mobile (Inline expanded panel under the input)
    const MobileAmplified = (
      <>
        <Input
          ref={ref}
          value={value}
          onChange={handleChangeInput}
          onBlur={handleBlurInput}
          onKeyDown={handleKeyDownInput}
          onFocus={(e) => {
            // Open inline editor and keep highlight
            openByFocus();
            rest.onFocus?.(e);
          }}
          onClick={openByFocus}
          placeholder={placeholder}
          className={[
            className ?? '',
            active ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow' : 'transition-shadow',
          ].join(' ')}
          {...rest}
        />

        {/* Inline expanded area directly under the input on mobile */}
        {open && (
          <div
            className='mt-2 rounded-lg border bg-background shadow-sm p-3 space-y-3'
            // Close if user taps outside this block and the input loses focus (handled via handleClose on Enter/blur in textarea)
          >
            {/* Label/title (kept minimal to save vertical space) */}
            {(label ?? placeholder) && (
              <div className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                {label ?? placeholder}
              </div>
            )}

            <Textarea
              ref={editorRef}
              autoFocus
              value={value ?? ''}
              onChange={handleChangeTextarea}
              onBlur={handleBlurTextarea}
              onKeyDown={handleKeyDownTextarea}
              placeholder={placeholder}
              className='min-h-28 h-auto text-base leading-relaxed whitespace-pre-wrap break-words resize-none'
            />

            {/* Optional helper row: close action hidden for simplicity; blur or Enter will close */}
            {/* <div className="flex justify-end">
          <button onClick={handleClose} className="text-sm text-muted-foreground underline">Cerrar</button>
        </div> */}
          </div>
        )}
      </>
    );

    return isMobile ? MobileAmplified : DesktopAmplified;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
