import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, style, className, placeholder = '⚽' }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Intersection Observer para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de ser visible
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInView && src) {
      // Cargar imagen solo cuando sea visible
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setIsLoading(false);
      };
    }
  }, [isInView, src]);

  return (
    <div
      ref={imgRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isLoading ? 'rgba(255,255,255,0.05)' : 'transparent',
        ...(!imageSrc && { fontSize: '2rem' })
      }}
      className={className}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          style={{ ...style, objectFit: 'contain' }}
          className={className}
        />
      ) : (
        isLoading ? (
          <div style={{ opacity: 0.5 }}>{placeholder}</div>
        ) : (
          <div style={{ opacity: 0.3 }}>❌</div>
        )
      )}
    </div>
  );
};

export default LazyImage;
