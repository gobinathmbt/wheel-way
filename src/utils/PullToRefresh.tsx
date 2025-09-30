import React, { useState, useRef } from "react";

const PullToRefresh = ({ children, logo }) => {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  // ---- Mobile (touch) handlers ----
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    pulling.current = false;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    if (currentY - startY.current > 80 && window.scrollY === 0) {
      pulling.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (pulling.current) triggerRefresh();
  };

  // ---- Desktop (mouse drag) handlers ----
  const handleMouseDown = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.clientY;
      pulling.current = false;
    }
  };

  const handleMouseMove = (e) => {
    if (startY.current > 0) {
      const currentY = e.clientY;
      if (currentY - startY.current > 80 && window.scrollY === 0) {
        pulling.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (pulling.current) triggerRefresh();
    startY.current = 0; // reset
  };

  // ---- Refresh logic ----
  const triggerRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative min-h-screen"
    >
      {children}

      {refreshing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/30">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <img src={logo} alt="Company Logo" className="absolute w-18 h-18" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PullToRefresh;
