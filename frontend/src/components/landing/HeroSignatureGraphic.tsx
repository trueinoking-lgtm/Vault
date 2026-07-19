const outerVertices = [
  [400, 250],
  [530, 325],
  [530, 475],
  [400, 550],
  [270, 475],
  [270, 325],
] as const;

const innerVertices = [
  [400, 320],
  [469, 360],
  [469, 440],
  [400, 480],
  [331, 440],
  [331, 360],
] as const;

const nodeDelays = ['0ms', '260ms', '520ms', '300ms', '380ms', '200ms', '420ms'];

function points(vertices: ReadonlyArray<readonly [number, number]>) {
  return vertices.map(([x, y]) => `${x},${y}`).join(' ');
}

export default function HeroSignatureGraphic() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none hero-signature-graphic"
    >
      <svg className="h-full w-full" viewBox="0 0 800 800" fill="none" preserveAspectRatio="xMidYMid slice">
        <g data-design-motion="hero-signature-graphic" className="graphic-pulse" style={{ transformOrigin: '400px 400px' }}>
          <g className="spin-slow" style={{ transformOrigin: '400px 400px' }}>
            <circle cx="400" cy="400" r="300" stroke="#C9A227" strokeWidth="1.2" strokeDasharray="7 13" />
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const radians = (angle * Math.PI) / 180;
              return <circle key={angle} cx={400 + 300 * Math.cos(radians)} cy={400 + 300 * Math.sin(radians)} r="4" fill="#C9A227" />;
            })}
          </g>

          <g className="spin-reverse" style={{ transformOrigin: '400px 400px' }}>
            <circle cx="400" cy="400" r="210" stroke="#2FA8A0" strokeWidth="1.25" opacity="0.72" />
            <path d="M400 184l8 13h-16z" fill="#2FA8A0" opacity="0.8" />
          </g>

          <g strokeLinecap="round" strokeLinejoin="round">
            <polygon points={points(outerVertices)} stroke="#C9A227" strokeWidth="2" />
            <polygon points={points(innerVertices)} stroke="#C9A227" strokeWidth="1.6" />

            {outerVertices.map(([x, y], index) => {
              const [innerX, innerY] = innerVertices[index];
              return (
                <path
                  key={`connector-${x}-${y}`}
                  id={`hero-connector-${index}`}
                  d={`M${x} ${y} L${innerX} ${innerY}`}
                  stroke={index % 2 === 0 ? '#2FA8A0' : '#C9A227'}
                  strokeWidth="1.25"
                  opacity="0.8"
                />
              );
            })}

            <path id="hero-signal-cross" d="M331 360 L469 440" stroke="#2FA8A0" strokeWidth="1" opacity="0.55" />
            <path d="M331 440 L469 360" stroke="#2FA8A0" strokeWidth="1" opacity="0.55" />

            <g stroke="#C9A227" strokeWidth="1.5">
              <path d="M400 365 L431 383 L400 401 L369 383 Z" fill="var(--bg-surface)" />
              <path d="M369 383 L400 401 L400 437 L369 419 Z" fill="var(--bg-surface-raised)" />
              <path d="M431 383 L400 401 L400 437 L431 419 Z" fill="var(--teal-soft)" />
            </g>

            {[...outerVertices, ...innerVertices, [400, 400] as const].map(([x, y], index) => (
              <circle
                key={`node-${x}-${y}`}
                data-design-motion={index === 0 ? 'node-glow' : undefined}
                className="node-glow"
                cx={x}
                cy={y}
                r={index < outerVertices.length ? 5 : 4}
                fill={index % 3 === 0 ? '#2FA8A0' : '#C9A227'}
                style={{ animationDelay: nodeDelays[index % nodeDelays.length] }}
              />
            ))}

            <circle className="signal-dot" r="3.5" fill="#C9A227">
              <animateMotion dur="4.8s" repeatCount="indefinite"><mpath href="#hero-connector-0" /></animateMotion>
            </circle>
            <circle className="signal-dot" r="3" fill="#2FA8A0">
              <animateMotion dur="5.6s" begin="-1.7s" repeatCount="indefinite"><mpath href="#hero-connector-3" /></animateMotion>
            </circle>
            <circle className="signal-dot" r="3" fill="#C9A227">
              <animateMotion dur="6.4s" begin="-3.1s" repeatCount="indefinite"><mpath href="#hero-signal-cross" /></animateMotion>
            </circle>
          </g>
        </g>
      </svg>
    </div>
  );
}
