import React, { useEffect, useRef } from 'react';

export function ParticlesBackground({ enabled, isDark = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Load particles.js from CDN
    const script = document.createElement('script');
    script.src = '/particles.min.js';
    script.async = true;
    script.onload = () => {
      if (window.particlesJS && containerRef.current) {
        // Configure particles with corporate colors
        const particleConfig = {
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: ['#E42E0F', '#FF6B35', '#FF8C42', '#FFA500'] // Corporate red and orange colors
            },
            shape: {
              type: 'star',
              stroke: {
                width: 0,
                color: '#000000'
              }
            },
            opacity: {
              value: 0.5,
              random: true,
              anim: {
                enable: false,
                speed: 1,
                opacity_min: 0.1,
                sync: false
              }
            },
            size: {
              value: 3,
              random: {
                enable: true,
                minimumValue: 2
              },
              anim: {
                enable: false,
                speed: 2,
                size_min: 1,
                sync: false
              }
            },
            line_linked: {
              enable: true,
              distance: 170,
              color: '#E42E0F',
              opacity: 0.3,
              width: 1
            },
            move: {
              enable: true,
              speed: 3,
              direction: 'none',
              random: false,
              straight: false,
              out_mode: 'bounce',
              bounce: false,
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: 'cancas',
            events: {
              onhover: {
                enable: true,
                mode: 'grab'
              },
              onclick: {
                enable: true,
                mode: 'push'
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3
              },
              repulse: {
                distance: 200,
                duration: 0.4
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true
        };

        // Initialize particles
        window.particlesJS('particles-js', particleConfig);
      }
    };
    
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      
      // Clear particles container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [enabled, isDark]);

  // Clear particles when disabled
  useEffect(() => {
    if (!enabled && containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      id="particles-js"
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
} 