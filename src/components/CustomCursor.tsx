'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Dot follows exactly
  const dotX = useSpring(mouseX, { stiffness: 2000, damping: 60 });
  const dotY = useSpring(mouseY, { stiffness: 2000, damping: 60 });

  // Ring follows with lag
  const ringX = useSpring(mouseX, { stiffness: 200, damping: 25 });
  const ringY = useSpring(mouseY, { stiffness: 200, damping: 25 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    const addHoverListeners = () => {
      document.querySelectorAll('a, button, [role="button"], input, label, select').forEach(el => {
        el.addEventListener('mouseenter', () => setHovering(true));
        el.addEventListener('mouseleave', () => setHovering(false));
      });
    };

    addHoverListeners();

    // Re-run when DOM changes (modals open etc.)
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      observer.disconnect();
    };
  }, [mouseX, mouseY, visible]);

  return (
    <>
      {/* Outer ring — lags behind */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ opacity: { duration: 0.2 } }}
      >
        <motion.div
          animate={{
            width: hovering ? 52 : 36,
            height: hovering ? 52 : 36,
            borderColor: hovering
              ? 'rgba(200, 169, 110, 0.8)'   // gold on hover
              : 'rgba(240, 235, 227, 0.5)',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ borderWidth: 1, borderStyle: 'solid', borderRadius: '50%' }}
        />
      </motion.div>

      {/* Inner dot — follows instantly */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          width: 4,
          height: 4,
        }}
        animate={{
          opacity: visible ? 1 : 0,
          backgroundColor: hovering ? '#C8A96E' : '#F0EBE3',
          scale: hovering ? 1.5 : 1,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
