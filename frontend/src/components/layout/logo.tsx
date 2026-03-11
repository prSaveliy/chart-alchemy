export const Logo = () => {
  const color = "black";
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1660 200"
      width={160}
      height={40}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap');`}</style>
      <path d="M 20 180 L 20 138 Q 20 130 28 130 L 62 130 Q 70 130 70 138 L 70 180 Z" fill={color} />
      <path d="M 80 180 L 80 88 Q 80 80 88 80 L 122 80 Q 130 80 130 88 L 130 180 Z" fill={color} />
      <path d="M 140 180 L 140 38 Q 140 30 148 30 L 182 30 Q 190 30 190 38 L 190 180 Z" fill={color} />

      <text
        x="200"
        y="180"
        fontFamily="Montserrat, sans-serif"
        fontWeight="700"
        fontSize="210"
        letterSpacing="-12"
        fill={color}
      >
        ChartAlchemy
      </text>
    </svg>
  );
};
