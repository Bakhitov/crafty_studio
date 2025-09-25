'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2Icon, SendIcon, SquareIcon, XIcon } from 'lucide-react';
import { Children, useCallback, useEffect, useRef, forwardRef } from 'react';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';

type UseAutoResizeTextareaProps = {
  minHeight: number;
  maxHeight?: number;
};

const useAutoResizeTextarea = ({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
};

export type AIInputProps = HTMLAttributes<HTMLFormElement>;

export const AIInput = ({ className, ...props }: AIInputProps) => (
  <form
    className={cn(
      'w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm',
      className
    )}
    {...props}
  />
);

export type AIInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  minRows?: number;
  maxRows?: number;
};

export const AIInputTextarea = forwardRef<HTMLTextAreaElement, AIInputTextareaProps>(({ 
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight,
  maxHeight,
  minRows = 3,
  maxRows = 20,
  ...props
}: AIInputTextareaProps, forwardedRef) => {
  // Compute pixel heights from rows once we know computed styles
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const computeHeights = useCallback((): { minPx: number; maxPx: number } => {
    const el = internalRef.current;
    let line = 16;
    let padT = 0;
    let padB = 0;
    if (el) {
      const cs = getComputedStyle(el);
      const parsePx = (v: string): number => (v.endsWith('px') ? parseFloat(v) : Number.NaN);
      const fontSize = parsePx(cs.fontSize) || 16;
      const lineHeight = cs.lineHeight === 'normal' ? fontSize * 1.3 : parsePx(cs.lineHeight) || fontSize * 1.3;
      line = lineHeight;
      padT = parsePx(cs.paddingTop) || 0;
      padB = parsePx(cs.paddingBottom) || 0;
    }
    const minPx = (minHeight ?? Math.round(line * minRows + padT + padB));
    const maxPx = (maxHeight ?? Math.round(line * maxRows + padT + padB));
    return { minPx, maxPx };
  }, [minHeight, maxHeight, minRows, maxRows]);

  const heights = computeHeights();
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: heights.minPx,
    maxHeight: heights.maxPx,
  });

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // Recalculate height when controlled value changes programmatically
  useEffect(() => {
    adjustHeight();
  }, [props.value, heights.minPx, heights.maxPx, adjustHeight]);

  return (
    <Textarea
      name="message"
      placeholder={placeholder}
      ref={(el: HTMLTextAreaElement | null) => {
        // attach to internal ref for auto-resize
        (textareaRef as any).current = el;
        internalRef.current = el;
        // forward to parent if provided
        if (typeof forwardedRef === 'function') {
          forwardedRef(el);
        } else if (forwardedRef && typeof forwardedRef === 'object') {
          (forwardedRef as any).current = el;
        }
      }}
      className={cn(
        'w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0',
        'bg-transparent dark:bg-transparent',
        'focus-visible:ring-0',
        className
      )}
      onChange={(e) => {
        adjustHeight();
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});

export type AIInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const AIInputToolbar = ({
  className,
  ...props
}: AIInputToolbarProps) => (
  <div
    className={cn('flex items-center justify-between p-1', className)}
    {...props}
  />
);

export type AIInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const AIInputTools = ({ className, ...props }: AIInputToolsProps) => (
  <div
    className={cn(
      'flex items-center gap-1',
      '[&_button:first-child]:rounded-bl-xl',
      className
    )}
    {...props}
  />
);

export type AIInputButtonProps = ComponentProps<typeof Button>;

export const AIInputButton = ({
  variant = 'ghost',
  className,
  size,
  ...props
}: AIInputButtonProps) => {
  const newSize =
    (size ?? Children.count(props.children) > 1) ? 'default' : 'icon';

  return (
    <Button
      type="button"
      variant={variant}
      size={newSize}
      className={cn(
        'shrink-0 gap-1.5 rounded-lg',
        variant === 'ghost' && 'text-muted-foreground',
        newSize === 'default' && 'px-3',
        className
      )}
      {...props}
    />
  );
};

export type AIInputSubmitProps = ComponentProps<typeof Button> & {
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
};

export const AIInputSubmit = ({
  className,
  variant = 'default',
  size = 'icon',
  status,
  children,
  ...props
}: AIInputSubmitProps) => {
  let Icon = <SendIcon />;

  if (status === 'submitted') {
    Icon = <Loader2Icon className="animate-spin" />;
  } else if (status === 'streaming') {
    Icon = <SquareIcon />;
  } else if (status === 'error') {
    Icon = <XIcon />;
  }

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={cn('gap-1.5 rounded-lg rounded-br-xl', className)}
      {...props}
    >
      {children ?? Icon}
    </Button>
  );
};

export type AIInputModelSelectProps = ComponentProps<typeof Select>;

export const AIInputModelSelect = (props: AIInputModelSelectProps) => (
  <Select {...props} />
);

export type AIInputModelSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const AIInputModelSelectTrigger = ({
  className,
  ...props
}: AIInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      'border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors',
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
);

export type AIInputModelSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const AIInputModelSelectContent = ({
  className,
  ...props
}: AIInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
);

export type AIInputModelSelectItemProps = ComponentProps<typeof SelectItem>;

export const AIInputModelSelectItem = ({
  className,
  ...props
}: AIInputModelSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type AIInputModelSelectValueProps = ComponentProps<typeof SelectValue>;

export const AIInputModelSelectValue = ({
  className,
  ...props
}: AIInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);