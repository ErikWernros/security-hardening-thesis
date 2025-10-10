import { cn } from '@/lib/utils'; // Se till att du har denna hjälpare

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted', // Anpassa bg-muted till er färgpalett
        className,
      )}
      {...props}
    />
  );
};
