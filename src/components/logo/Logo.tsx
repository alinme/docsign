import React from "react";

const Logo = ({ className = "w-10 h-10" }) => {
  return (
    <img
      src="/logo.svg"
      alt="GetSign"
      className={className}
    />
  );
};

export default Logo;
