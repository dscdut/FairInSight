import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-h1', 'text-h2', 'text-h3', 'text-h4', 'text-h5', 'text-p', 'text-p-medium',
        'text-large', 'text-small', 'text-blockquote', 'text-placeholder', 'text-btn-giant',
        'text-btn-large', 'text-btn-medium', 'text-btn-small', 'text-btn-tiny'
      ]
    }
  }
});

function cn(...inputs) {
  return customTwMerge(clsx(inputs));
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow hover:opacity-90',
        destructive: 'bg-error-primary text-white shadow-sm hover:bg-error-secondary',
        outline: 'border border-border-primary bg-background-primary text-text-primary shadow-sm hover:bg-background-secondary',
        secondary: 'bg-white text-text-primary shadow-sm hover:bg-background-tertiary',
        ghost: 'text-text-primary justify-start px-0',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2 text-btn-medium [&_svg]:size-5 ',
        sm: 'h-8 px-3 text-btn-small [&_svg]:size-4',
        lg: 'h-12 px-8 text-btn-large [&_svg]:size-6',
        icon: 'h-10 w-10 text-btn-medium [&_svg]:size-5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

console.log("Without compound variants (variant first):");
console.log(cn(buttonVariants({ variant: 'ghost', size: 'default' })));
