export default function SkeletonRows({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c}>
              <span className="placeholder-glow d-block">
                <span className="placeholder col-8" />
              </span>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
