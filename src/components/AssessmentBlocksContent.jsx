function AssessmentTable({ headers, rows }) {
  return (
    <table className="mr-table">
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={`row-${ri}`}>
            {row.map((cell, ci) => (
              <td key={`cell-${ri}-${ci}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AssessmentContentBody({ content }) {
  if (!content) return null;
  if (content.type === 'paragraph') {
    return <p className="mr-assessment__p">{content.text}</p>;
  }
  if (content.type === 'list') {
    return (
      <ul className="mr-assessment__list">
        {content.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (content.type === 'kv-list') {
    return (
      <div className="mr-assessment__kv-list">
        {content.items.map(({ label, value }) => (
          <div className="mr-assessment__kv" key={label}>
            <span className="mr-assessment__kv-label">{label}</span>
            <span className="mr-assessment__kv-value">{value}</span>
          </div>
        ))}
      </div>
    );
  }
  if (content.type === 'table') {
    return <AssessmentTable headers={content.headers} rows={content.rows} />;
  }
  return null;
}

export default function AssessmentBlocksContent({ blocks, intro }) {
  const items = Array.isArray(blocks) ? blocks : [];
  const introText = String(intro || '').trim();

  if (!introText && !items.length) {
    return <p className="mr-assessment__p">Patient assessed during the reporting period.</p>;
  }

  return (
    <>
      {introText ? <p className="mr-assessment__p">{introText}</p> : null}
      {items.map((block) => (
        block.type === 'subsection' ? (
          <div className="mr-assessment__subsection" key={block.title}>
            <h4 className="mr-assessment__subsection-title">{block.title}</h4>
            <AssessmentContentBody content={block.content} />
          </div>
        ) : null
      ))}
    </>
  );
}
