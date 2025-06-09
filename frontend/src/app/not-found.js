export default function NotFound() {
  return (
    <>
      <style>{`
            @keyframes rotateX {
              0% {
                transform: rotateX(0deg) rotateY(0deg);
              }
              100% {
                transform: rotateX(20deg) rotateY(15deg);
              }
            }
          `}</style>
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "radial-gradient(circle at center, #001529, #000814)",
          color: "#00aaff",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          perspective: "800px",
          overflow: "hidden",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "14rem",
            fontWeight: "900",
            textShadow: `
                0 0 10px #00aaff,
                0 0 20px #00d4ff,
                0 0 30px #00d4ff
              `,
            transformStyle: "preserve-3d",
            animation: "rotateX 5s linear infinite alternate",
            margin: 0,
            userSelect: "none",
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: "2rem",
            marginTop: "20px",
            color: "#66cfff",
            textShadow: "0 0 10px #00aaff",
            fontWeight: "600",
            userSelect: "none",
            letterSpacing: "1.5px",
          }}
        >
          Page not found
        </p>
      </div>
    </>
  );
}
