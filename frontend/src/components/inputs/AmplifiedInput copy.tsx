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

// Unified handlers for Input | Textarea
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
    const [focused, setFocused] = React.useState(false); // NEW: focus ring on keyboard navigation
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
    };
    const handleClose = () => {
      setOpen(false);
      if (intent === 'focus' && onBlur) {
        onBlur({} as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
      }
      setIntent('idle');
    };

    // Base input wrappers
    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e);
    const handleBlurInput = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      setFocused(false); // remove focus ring when base input loses focus
    };
    const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => onKeyDown?.(e);

    // Textarea wrappers
    const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e);
    const handleBlurTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => onBlur?.(e);
    const handleKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter (without Shift) -> keep parent behavior, then close
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
              setFocused(true); // NEW: mark as focused for ring
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
              // Show ring when hovered OR focused (keyboard/tab/enter navigation)
              hovered || focused
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
    const MobileAmplified = (
      <>
        <Input
          ref={ref}
          value={value}
          onChange={handleChangeInput}
          onBlur={handleBlurInput}
          onKeyDown={handleKeyDownInput}
          onFocus={(e) => {
            setFocused(true); // NEW: focus ring for keyboard nav (if any)
            openByFocus();
            rest.onFocus?.(e);
          }}
          onClick={openByFocus}
          placeholder={placeholder}
          className={[
            className ?? '',
            focused
              ? 'ring-2 ring-primary/55 ring-offset-1 transition-shadow'
              : 'transition-shadow',
          ].join(' ')}
          {...rest}
        />
        <Sheet open={open} onOpenChange={(o) => (o ? openByFocus() : handleClose())}>
          <SheetContent side='bottom' className='relative h-[78vh] pt-10'>
            {/* Small close "x" */}
            <button
              type='button'
              aria-label='Close'
              onClick={handleClose}
              className='absolute top-2 right-2 p-1 rounded hover:bg-muted'
            >
              <X className='h-5 w-5' />
            </button>

            <SheetHeader className='mb-3'>
              <SheetTitle className='text-sm'>{label ?? placeholder ?? 'Editar'}</SheetTitle>
            </SheetHeader>

            <div className='space-y-3'>
              <Textarea
                ref={editorRef}
                autoFocus
                value={value ?? ''}
                onChange={handleChangeTextarea}
                onBlur={handleBlurTextarea}
                onKeyDown={handleKeyDownTextarea}
                placeholder={placeholder}
                className='
                  min-h-[46vh] h-auto text-base leading-relaxed
                  whitespace-pre-wrap break-words resize-none
                '
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    );

    return isMobile ? MobileAmplified : DesktopAmplified;
  },
);

AmplifiedInput.displayName = 'AmplifiedInput';
