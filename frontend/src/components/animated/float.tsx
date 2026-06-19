import React, { useState, useEffect, useRef } from 'react';

interface FloatAnimateProps {
  children: React.ReactNode;
  direct?: 'up' | 'down' | 'left' | 'right';
  speed?: number;
  delay?: number;
  distance?: number;
  triggerOnScroll?: boolean;
  className?: string;
}

export const FloatAnimate: React.FC<FloatAnimateProps> = ({
  children,
  direct = 'up',
  speed = 1.2,
  delay = 0,
  distance = 40,
  triggerOnScroll = true,
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerOnScroll) {
      const timer = setTimeout(() => setIsRevealed(true), 50);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [triggerOnScroll]);

  const getTransformStyle = (): string => {
    if (isRevealed) return 'translate(0, 0)';
    
    switch (direct) {
      case 'up':
        return `translateY(${distance}px)`;
      case 'down':
        return `translateY(${-distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(${-distance}px)`;
      default:
        return `translateY(${distance}px)`;
    }
  };

  const containerStyle: React.CSSProperties = {
    transform: getTransformStyle(),
    opacity: isRevealed ? 1 : 0,
    filter: isRevealed ? 'blur(0px)' : 'blur(8px)',
    transitionProperty: 'transform, opacity, filter',
    transitionDuration: `${speed}s`,
    transitionDelay: `${delay}s`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)', // Đường cong trượt siêu mượt (EaseOutExpo)
    willChange: 'transform, opacity, filter',
  };

  return (
    <div ref={elementRef} style={containerStyle} className={`${className}`}>
      {children}
    </div>
  );
};