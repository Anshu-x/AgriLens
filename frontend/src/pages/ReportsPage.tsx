import React, { useMemo } from 'react';
import './pages.css';

const ReportsPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);

  const handlePrint = () => {
    window.print();
  };

  const recent = [1,2,3,4].map(i => ({
    id: i,
    title: `Plot report - ${today.toLocaleDateString()}`
  }));

  return (
    <div className="page-grid">
      <div className="panel report">
        <div className="panel-title">Plot report - {today.toLocaleDateString()}</div>

        <div className="report-table">
          <div className="thead">
            <div>Metric</div>
            <div>Current value</div>
            <div>Trend</div>
            <div>Recommendation</div>
          </div>
          <div className="trow">
            <div className="metric">CHI</div>
            <div className="value">0.75</div>
            <div className="trend">↓ Decreasing</div>
            <div className="reco">“Irrigation needed within 3 days”</div>
          </div>
          <div className="trow empty" />
          <div className="trow empty" />
          <div className="trow empty" />
        </div>

        <div className="report-actions">
          <button className="btn primary" onClick={handlePrint}>Download PDF</button>
        </div>

        <div className="recent">
          <div className="recent-title">last reports list</div>
          <ul className="recent-list">
            {recent.map(r => (
              <li key={r.id}>
                <span className="title">{r.title}</span>
                <button className="btn small">Download again</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;


