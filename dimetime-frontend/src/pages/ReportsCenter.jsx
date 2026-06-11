import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Download, FileSpreadsheet, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReportsCenter() {
  const [loadingReport, setLoadingReport] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const showToastSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const showToastError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  // Helper to escape values and build CSV content
  const convertToCSV = (headers, rows) => {
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const values = row.map(value => {
        const escaped = ('' + (value ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Helper to build Excel-compatible HTML spreadsheet
  const convertToExcel = (headers, rows) => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"/><style>table { border-collapse: collapse; } th { background-color: #0f172a; color: #ffffff; font-weight: bold; } td, th { border: 1px solid #cbd5e1; padding: 5px; text-align: left; }</style></head>`;
    html += `<body><table><thead><tr>`;
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += `</tr></thead><tbody>`;
    rows.forEach(r => {
      html += `<tr>`;
      r.forEach(v => { html += `<td>${v ?? ''}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;
    return html;
  };

  // Helper to open printing window for PDF conversion
  const printPDF = (reportName, headers, rows) => {
    const printWindow = window.open('', '_blank');
    let html = `<html><head><title>${reportName}</title>`;
    html += `<style>`;
    html += `body { font-family: 'Inter', system-ui, sans-serif; background-color: #ffffff; color: #0f172a; padding: 2rem; }`;
    html += `.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 2rem; }`;
    html += `.title { font-size: 20px; font-weight: 800; text-transform: uppercase; }`;
    html += `.meta { font-size: 11px; color: #64748b; text-align: right; }`;
    html += `table { width: 100%; border-collapse: collapse; margin-top: 1rem; }`;
    html += `th { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 10px; text-transform: uppercase; padding: 6px; text-align: left; border: 1px solid #cbd5e1; }`;
    html += `td { padding: 6px; font-size: 10px; border: 1px solid #cbd5e1; text-align: left; }`;
    html += `tr:nth-child(even) { background-color: #f8fafc; }`;
    html += `@media print { body { padding: 0; } }`;
    html += `</style></head><body>`;
    html += `<div class="header">`;
    html += `<div><div class="title">${reportName}</div><div style="font-size: 11px; color: #64748b; margin-top: 4px;">DimeTime SCM Control Tower Generated Report</div></div>`;
    html += `<div class="meta">Generated: ${new Date().toLocaleString()}<br/>Ledger Security: Verified</div>`;
    html += `</div>`;
    html += `<table><thead><tr>`;
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += `</tr></thead><tbody>`;
    rows.forEach(r => {
      html += `<tr>`;
      r.forEach(v => { html += `<td>${v ?? ''}</td>`; });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    html += `<script>window.onload = function() { window.print(); window.close(); }</script>`;
    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExport = async (reportKey, reportName, format) => {
    setLoadingReport(reportKey);
    setError('');
    try {
      let headers = [];
      let rows = [];

      if (reportKey === 'RFQ') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/rfqs');
        headers = ['RFQ Number', 'Material', 'Grade', 'Dimension', 'Quantity', 'Created By', 'Target Date', 'Status', 'Created Date'];
        rows = res.data.map(r => [
          r.rfqNumber, r.material, r.grade, r.dimension, r.quantity, r.createdBy, r.targetDate, r.status, new Date(r.createdAt).toLocaleString()
        ]);
      } else if (reportKey === 'PO') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/purchase-orders');
        headers = ['PO Number', 'Supplier', 'Manufacturer', 'Material', 'Grade', 'Dimension', 'Quantity', 'Status', 'Created Date'];
        rows = res.data.map(p => [
          p.poNumber, p.supplier, p.manufacturer, p.material, p.grade, p.dimension, p.quantity, p.status, new Date(p.createdAt).toLocaleString()
        ]);
      } else if (reportKey === 'OCR') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/material-uploads');
        headers = ['Upload ID', 'PO Number', 'Extracted Grade', 'Extracted Quantity', 'Extracted Dimension', 'Extracted Heat Number', 'Confidence', 'Upload Date', 'Uploaded By'];
        rows = res.data.map(o => [
          o.id, o.poNumber, o.extractedGrade, o.extractedQuantity, o.extractedDimension, o.extractedHeatNumber, `${o.ocrConfidence}%`, new Date(o.uploadDate).toLocaleString(), o.uploadedBy
        ]);
      } else if (reportKey === 'MTC') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/mtc-documents');
        headers = ['MTC ID', 'PO Number', 'Manufacturer', 'Version', 'Match Score', 'Status', 'Submitted Date'];
        rows = res.data.map(m => [
          m.id, m.poNumber, m.manufacturer, m.version, `${m.matchScore}%`, m.status, new Date(m.submittedDate).toLocaleString()
        ]);
      } else if (reportKey === 'DISPATCH') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/purchase-orders');
        const dispatches = res.data.filter(p => p.dispatchCarrier || ['DISPATCHED', 'DELIVERED', 'RECONCILED', 'COMPLETED', 'CLOSED'].includes(p.status.toUpperCase()));
        headers = ['PO Number', 'Supplier', 'Manufacturer', 'Dispatch Carrier', 'Tracking Number', 'Status', 'Created Date'];
        rows = dispatches.map(p => [
          p.poNumber, p.supplier, p.manufacturer, p.dispatchCarrier || 'N/A', p.dispatchTrackingNumber || 'N/A', p.status, new Date(p.createdAt).toLocaleString()
        ]);
      } else if (reportKey === 'GRN') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/grns');
        headers = ['GRN Number', 'PO Number', 'Material', 'Quantity', 'Generated Date', 'Status', 'Generated By'];
        rows = res.data.map(g => [
          g.grnNumber, g.poNumber, g.material, g.quantity, new Date(g.generatedDate).toLocaleString(), g.status, g.generatedBy
        ]);
      } else if (reportKey === 'AUDIT') {
        const res = await axios.get('https://dime-time-backend.onrender.com/api/audit-logs');
        headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Module', 'IP Address'];
        rows = res.data.map(a => [
          a.id, new Date(a.timestamp).toLocaleString(), a.username, a.role || 'N/A', a.activity, a.module || 'N/A', a.ipAddress || '127.0.0.1'
        ]);
      }

      if (rows.length === 0) {
        showToastError(`No dynamic transactional ledger records found to generate ${reportName}.`);
        return;
      }

      if (format === 'csv') {
        const csvContent = convertToCSV(headers, rows);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportKey.toLowerCase()}_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'xlsx') {
        const excelContent = convertToExcel(headers, rows);
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${reportKey.toLowerCase()}_report_${Date.now()}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        printPDF(reportName, headers, rows);
      }

      showToastSuccess(`${reportName} generated and exported as ${format.toUpperCase()}.`);
    } catch (err) {
      console.error(err);
      showToastError(`Failed to fetch and export ${reportName}.`);
    } finally {
      setLoadingReport('');
    }
  };

  const reports = [
    { key: 'RFQ', name: 'RFQ Report', description: 'RFQs created, broadcasted materials specifications, bid counts and statuses.' },
    { key: 'PO', name: 'PO Report', description: 'Financial purchase order ledger, supplier details, manufacturing assignments, and statuses.' },
    { key: 'OCR', name: 'OCR Report', description: 'AI receipt OCR scanned documents metadata, confidence percentages, and verification values.' },
    { key: 'MTC', name: 'MTC Report', description: 'MTC Verification documents match scores, mill parameters compliance, and approval status.' },
    { key: 'DISPATCH', name: 'Dispatch Report', description: 'Carrier freight tracking, dispatches, tracking numbers, and transit status.' },
    { key: 'GRN', name: 'GRN Report', description: 'Goods Receipt Note dynamic ledger, received quantities, gate check status, and audits.' },
    { key: 'AUDIT', name: 'Audit Report', description: 'Comprehensive system user activity trails, logged times, modules, roles, and IP logs.' }
  ];

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '100%', width: '100%', margin: 0 }}>
      {/* Toast Alert */}
      <div className="toast-container">
        {error && <div className="toast toast-error"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} /><span>{error}</span></div></div>}
        {success && <div className="toast"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} /><span>{success}</span></div></div>}
      </div>

      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={24} style={{ color: 'var(--accent-color)' }} /> SCM Control Tower Report Center
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Generate, audit, and export SCM reports compiled from real-time database transactions.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {reports.map((report) => (
          <div key={report.key} className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '190px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{report.name}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.825rem', lineHeight: '1.4' }}>{report.description}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', gap: '0.3rem' }} 
                onClick={() => handleExport(report.key, report.name, 'csv')}
                disabled={!!loadingReport}
              >
                {loadingReport === report.key ? 'Exporting...' : 'CSV'}
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', gap: '0.3rem' }} 
                onClick={() => handleExport(report.key, report.name, 'xlsx')}
                disabled={!!loadingReport}
              >
                {loadingReport === report.key ? 'Exporting...' : 'Excel'}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', gap: '0.3rem' }} 
                onClick={() => handleExport(report.key, report.name, 'pdf')}
                disabled={!!loadingReport}
              >
                {loadingReport === report.key ? 'Exporting...' : 'PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

