export const disclaimer =
  'この診断は、たんぱく質の働きを性格にたとえて楽しむエンターテインメントです。' +
  '科学的な性格検査ではありません。';

export function Disclaimer() {
  return <footer>{disclaimer}</footer>;
}

export function Chain({ folding = false }: { folding?: boolean }) {
  const positions = [20, 60, 100, 140, 180, 220, 260, 300];
  const heights = [70, 34, 55, 76, 55, 34, 55, 70];

  return (
    <svg
      className={`chain ${folding ? 'folding' : ''}`}
      viewBox="0 0 320 120"
      aria-hidden="true"
    >
      <path
        d="M20 70 Q60 0 100 55 T180 55 T260 55 L300 70"
        fill="none"
        stroke="#8b7fd6"
        strokeWidth="3"
      />
      {positions.map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy={heights[index]}
          r="8"
          fill={index % 2 ? '#8b7fd6' : '#0f9b8e'}
        />
      ))}
    </svg>
  );
}
