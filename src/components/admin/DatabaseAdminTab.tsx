import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseBackup, SqlQueryResult } from '../../types';
import { ZipInspectionResult } from '../../utils/zipBackup';

export const DatabaseAdminTab: React.FC = () => {
  const {
    isMockDataSeeded,
    databaseStats,
    databaseBackups,
    seedMockData,
    unseedMockData,
    clearMockData,
    createDatabaseBackup,
    restoreDatabaseFromJson,
    executeSqlQuery,
    deleteDatabaseBackup,
    downloadSqlDump,
    downloadJsonBackup,
    downloadFullZipBackup,
    restoreFromZipArchive,
    inspectZipArchive,
  } = useApp();

  // Local UI State
  const [toast, setToast] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, title, category, status, is_mock FROM events;');
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [customBackupName, setCustomBackupName] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Restore Modal & File Upload State
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreTargetBackup, setRestoreTargetBackup] = useState<DatabaseBackup | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedZipFile, setUploadedZipFile] = useState<File | null>(null);
  const [zipInspection, setZipInspection] = useState<ZipInspectionResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast Helper
  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Seed / Unseed Actions
  const handleSeedMockData = () => {
    const res = seedMockData();
    showNotice(`Successfully seeded ${res.addedEvents} demo events and ${res.addedAttendees} demo attendees (is_mock = 1). Real data preserved.`);
  };

  const handleUnseedMockData = () => {
    const res = unseedMockData();
    showNotice(`Purged ${res.removedEvents} demo events and ${res.removedAttendees} demo attendees. All real user events and ticket orders remain 100% safe.`);
  };

  const handleClearMockData = () => {
    clearMockData();
    showNotice('Mock data cleared. Database is now in clean production state.');
  };

  // Backup Creation (In-memory snapshot)
  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    try {
      const name = customBackupName.trim() || undefined;
      const bkp = createDatabaseBackup(name);
      setCustomBackupName('');
      showNotice(`Created snapshot "${bkp.name}" (${(bkp.sizeBytes / 1024).toFixed(1)} KB).`);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Full ZIP Archive Download
  const handleDownloadFullZip = async (title?: string) => {
    setIsDownloadingZip(true);
    try {
      await downloadFullZipBackup(title);
      showNotice('Full ZIP archive downloaded! Includes database.sql, database.json, manifest, and all event banner images, logos, and attendee QR code passes.');
    } catch (err: any) {
      showNotice(`ZIP Export Failed: ${err.message || String(err)}`);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // SQL Query Execution
  const handleRunQuery = () => {
    if (!sqlQuery.trim()) {
      showNotice('Please write a SQL statement to execute.');
      return;
    }
    setIsExecutingSql(true);
    try {
      const res = executeSqlQuery(sqlQuery);
      setQueryResult(res);
      if (res.error) {
        showNotice(`SQL Error: ${res.error}`);
      } else {
        showNotice(`Query executed in ${res.executionTimeMs} ms (${res.rowCount} rows).`);
      }
    } finally {
      setIsExecutingSql(false);
    }
  };

  // File Upload Handler (Supports .zip, .json, and .sql)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setRestoreTargetBackup(null);

    if (file.name.toLowerCase().endsWith('.zip')) {
      setUploadedZipFile(file);
      setUploadedFileContent(null);
      try {
        const inspection = await inspectZipArchive(file);
        setZipInspection(inspection);
      } catch (err) {
        console.warn('Inspection failed:', err);
      }
      setRestoreModalOpen(true);
    } else {
      setUploadedZipFile(null);
      setZipInspection(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setUploadedFileContent(content);
        setRestoreModalOpen(true);
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute Restore
  const handleConfirmRestore = async () => {
    setIsRestoring(true);
    try {
      let res: { success: boolean; message: string };

      if (uploadedZipFile) {
        // Complete ZIP restoration (database + banners + logos + QR codes)
        res = await restoreFromZipArchive(uploadedZipFile, restoreMode);
      } else if (restoreTargetBackup) {
        res = restoreDatabaseFromJson(restoreTargetBackup.dataJson, restoreMode);
      } else if (uploadedFileContent) {
        if (uploadedFileName?.endsWith('.sql')) {
          const queryRes = executeSqlQuery(uploadedFileContent);
          res = {
            success: !queryRes.error,
            message: queryRes.error ? `SQL Restore error: ${queryRes.error}` : 'Successfully executed SQL restore script.',
          };
        } else {
          res = restoreDatabaseFromJson(uploadedFileContent, restoreMode);
        }
      } else {
        res = { success: false, message: 'No backup source selected for restoration.' };
      }

      if (res.success) {
        showNotice(res.message);
        setRestoreModalOpen(false);
        setUploadedFileContent(null);
        setUploadedFileName(null);
        setUploadedZipFile(null);
        setZipInspection(null);
        setRestoreTargetBackup(null);
      } else {
        showNotice(`Restore Failed: ${res.message}`);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <section className="page-content" style={{ padding: '0 0 32px 0' }}>
      {/* HEADER BANNER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#104A32' }}>
              Relational SQL Database &amp; Full Archive Backup
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #A7F3D0',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Connected (PostgreSQL Schema)
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                background: isMockDataSeeded ? '#FEF3C7' : '#EFF6FF',
                color: isMockDataSeeded ? '#92400E' : '#1E40AF',
                border: isMockDataSeeded ? '1px solid #FDE68A' : '1px solid #BFDBFE',
              }}
            >
              {isMockDataSeeded ? '⚡ Mock Data Seeded (Demo Mode)' : '🛡️ Mock Data Cleared (Clean Mode)'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#527461' }}>
            Multi-tenant PostgreSQL relational tables with complete ZIP export (database + event cover banners + logos + QR passes) and full restore.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleDownloadFullZip()}
            disabled={isDownloadingZip}
            style={{
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#047857',
              borderColor: '#047857',
              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
            }}
          >
            {isDownloadingZip ? 'Packing Complete ZIP...' : '📦 Download Full ZIP (Data + Media)'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={downloadSqlDump}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📥 .sql Dump
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => downloadJsonBackup()}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            📋 .json Snapshot
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#104A32' }}
          >
            {isCreatingBackup ? 'Creating Snapshot...' : '💾 Snapshot'}
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6EBE7',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#77847C', letterSpacing: '0.05em' }}>
            Total Database Records
          </span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#104A32', marginTop: '6px' }}>
            {databaseStats.totalRecords}
          </div>
          <span style={{ fontSize: '11px', color: '#527461' }}>Across 7 relational tables</span>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#166534', letterSpacing: '0.05em' }}>
              Real Data Records
            </span>
            <span style={{ fontSize: '10px', background: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
              Protected
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#15803D', marginTop: '6px' }}>
            {databaseStats.realRecords}
          </div>
          <span style={{ fontSize: '11px', color: '#166534' }}>Permanent user &amp; ticket records</span>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: isMockDataSeeded ? '#FFFBEB' : '#F9FAFB',
            border: isMockDataSeeded ? '1px solid #FDE68A' : '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: isMockDataSeeded ? '#92400E' : '#6B7280', letterSpacing: '0.05em' }}>
              Mock / Demo Records
            </span>
            <span style={{ fontSize: '10px', background: isMockDataSeeded ? '#FEF3C7' : '#F3F4F6', color: isMockDataSeeded ? '#B45309' : '#4B5563', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
              {isMockDataSeeded ? 'Seeded' : 'Cleared'}
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: isMockDataSeeded ? '#B45309' : '#4B5563', marginTop: '6px' }}>
            {databaseStats.mockRecords}
          </div>
          <span style={{ fontSize: '11px', color: isMockDataSeeded ? '#92400E' : '#6B7280' }}>
            {isMockDataSeeded ? 'Safe to purge anytime' : 'Zero mock data in database'}
          </span>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6EBE7',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#77847C', letterSpacing: '0.05em' }}>
            Storage Size / Snapshots
          </span>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#104A32', marginTop: '6px' }}>
            {(databaseStats.storageSizeBytes / 1024).toFixed(1)} KB
          </div>
          <span style={{ fontSize: '11px', color: '#527461' }}>
            {databaseBackups.length} snapshot(s) stored
          </span>
        </div>
      </div>

      {/* SECTION 1: MOCK DATA ISOLATION & SEEDING STATION */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6EBE7',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#104A32' }}>
              Mock Data Seed &amp; Unseed Controls
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#527461' }}>
              Safely populate or purge demo records without touching any real events, tickets, attendees, or financial transactions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSeedMockData}
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#104A32' }}
            >
              🌱 Seed Demo / Mock Data
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleUnseedMockData}
              disabled={databaseStats.mockRecords === 0}
              style={{
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: '#FCA5A5',
                color: '#B91C1C',
                opacity: databaseStats.mockRecords === 0 ? 0.4 : 1,
              }}
            >
              🧹 Unseed Mock Data ({databaseStats.mockRecords} rows)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleClearMockData}
              style={{ fontSize: '12px' }}
            >
              Clear All Mock
            </button>
          </div>
        </div>

        {/* Isolation Guarantee Banner */}
        <div
          style={{
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1px solid #DCFCE7',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.5' }}>
            <strong>Isolated Architecture:</strong> All mock records are flagged with <code style={{ background: '#DCFCE7', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>is_mock = 1</code> in the SQL schema. Unseeding will run a scoped <code style={{ background: '#DCFCE7', padding: '2px 5px', borderRadius: '4px' }}>DELETE ... WHERE is_mock = 1</code> query, ensuring all user-created events and orders remain 100% untouched.
          </div>
        </div>

        {/* Table Records Breakdown */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAF8', borderBottom: '1px solid #E6EBE7' }}>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Table Name</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Description</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Total Rows</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#15803D' }}>Real Data Rows</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#B45309' }}>Mock Demo Rows</th>
                <th style={{ padding: '10px 14px', fontWeight: '700', color: '#77847C' }}>Columns</th>
              </tr>
            </thead>
            <tbody>
              {databaseStats.tables.map((tbl) => (
                <tr key={tbl.tableName} style={{ borderBottom: '1px solid #F0F4F1' }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '700', color: '#104A32' }}>
                    {tbl.tableName}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                    {tbl.displayName}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: '700' }}>
                    {tbl.totalRows}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#15803D', fontWeight: '700' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', marginRight: '6px' }} />
                    {tbl.realRows} real
                  </td>
                  <td style={{ padding: '10px 14px', color: tbl.mockRows > 0 ? '#B45309' : '#94A3B8', fontWeight: '700' }}>
                    {tbl.mockRows > 0 ? (
                      <span style={{ background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px' }}>
                        {tbl.mockRows} mock
                      </span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '11px', fontFamily: 'monospace' }}>
                    {tbl.columns.slice(0, 4).join(', ')}... ({tbl.columns.length})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: FULL ZIP BACKUP & RESTORE CENTER */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6EBE7',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#104A32' }}>
              Full Archive Backup &amp; Media Restore (ZIP / SQL / JSON)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#527461' }}>
              Includes every piece of data: PostgreSQL DDL dump, JSON database, user-uploaded event banners, logos, and attendee QR code passes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownloadFullZip()}
              disabled={isDownloadingZip}
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#047857' }}
            >
              {isDownloadingZip ? 'Packing ZIP...' : '📦 Export Full ZIP Archive'}
            </button>
            <input
              type="text"
              placeholder="Snapshot label..."
              value={customBackupName}
              onChange={(e) => setCustomBackupName(e.target.value)}
              style={{ fontSize: '12px', height: '34px', padding: '0 10px', borderRadius: '6px', border: '1px solid #CCD7CE', width: '160px' }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              style={{ fontSize: '12px' }}
            >
              ＋ Snapshot
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip,.json,.sql"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              📤 Restore Archive (.zip / .sql)
            </button>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div
          style={{
            padding: '14px 18px',
            background: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <div>
              <strong style={{ fontSize: '13px', color: '#0369A1' }}>All-In-One ZIP Archive Support</strong>
              <div style={{ fontSize: '11px', color: '#0284C7', marginTop: '2px' }}>
                Archives pack <code style={{ background: '#E0F2FE', padding: '1px 4px', borderRadius: '3px' }}>database.sql</code>, <code style={{ background: '#E0F2FE', padding: '1px 4px', borderRadius: '3px' }}>database.json</code>, event cover graphics, custom logos, and attendee passes into a single portable zip download.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleDownloadFullZip()}
            disabled={isDownloadingZip}
            style={{ fontSize: '11px', background: '#FFFFFF', borderColor: '#38BDF8', color: '#0369A1' }}
          >
            {isDownloadingZip ? 'Generating...' : 'Download Complete ZIP Now'}
          </button>
        </div>

        {/* Saved Backups Table */}
        {databaseBackups.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              border: '2px dashed #E6EBE7',
              borderRadius: '10px',
              background: '#F8FAF8',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
            <strong style={{ color: '#104A32', fontSize: '14px' }}>No Saved Database Backups Yet</strong>
            <p style={{ fontSize: '12px', color: '#77847C', maxWidth: '400px', margin: '6px auto 14px auto' }}>
              Create a snapshot above to save a point-in-time copy of all tables, or download a full ZIP archive.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateBackup}
              style={{ fontSize: '12px' }}
            >
              Create First Database Snapshot
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAF8', borderBottom: '1px solid #E6EBE7' }}>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Snapshot Name</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Created Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Records</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Size</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32' }}>Created By</th>
                  <th style={{ padding: '10px 14px', fontWeight: '700', color: '#104A32', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {databaseBackups.map((bkp) => (
                  <tr key={bkp.id} style={{ borderBottom: '1px solid #F0F4F1' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#104A32' }}>
                      <span style={{ marginRight: '6px' }}>💾</span>
                      {bkp.name}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#527461' }}>
                      {new Date(bkp.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: '700' }}>{bkp.totalRecords} total</span>{' '}
                      <span style={{ fontSize: '11px', color: '#15803D' }}>({bkp.realRecordsCount} real, {bkp.mockRecordsCount} mock)</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#64748B' }}>
                      {(bkp.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>
                      {bkp.createdBy}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            setRestoreTargetBackup(bkp);
                            setUploadedFileContent(null);
                            setUploadedFileName(null);
                            setUploadedZipFile(null);
                            setZipInspection(null);
                            setRestoreModalOpen(true);
                          }}
                          style={{ height: '28px', fontSize: '11px', padding: '0 8px', color: '#104A32', borderColor: '#A7F3D0' }}
                        >
                          🔄 Restore
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleDownloadFullZip(bkp.name)}
                          style={{ height: '28px', fontSize: '11px', padding: '0 8px', color: '#047857', borderColor: '#6EE7B7' }}
                          title="Download Complete ZIP with Media"
                        >
                          ZIP
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => downloadJsonBackup(bkp.id)}
                          style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                          title="Download JSON Snapshot"
                        >
                          JSON
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={downloadSqlDump}
                          style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                          title="Download SQL Script"
                        >
                          SQL
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => deleteDatabaseBackup(bkp.id)}
                          style={{ height: '28px', fontSize: '11px', padding: '0 8px', color: '#B91C1C', borderColor: '#FCA5A5' }}
                          title="Delete snapshot"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: INTERACTIVE LIVE SQL QUERY RUNNER */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E6EBE7',
          borderRadius: '14px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#104A32' }}>
              Interactive SQL Console
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#527461' }}>
              Execute SQL queries directly against the database engine with instant schema inspection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSqlQuery('SELECT * FROM events;')}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}
            >
              SELECT * FROM events
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery('SELECT id, full_name, email, amount_paid, is_mock FROM attendees;')}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}
            >
              SELECT attendees
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery('SHOW TABLES;')}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}
            >
              SHOW TABLES
            </button>
            <button
              type="button"
              onClick={() => setSqlQuery('DESCRIBE attendees;')}
              style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer' }}
            >
              DESCRIBE attendees
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div style={{ marginBottom: '14px' }}>
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={4}
            placeholder="Write SQL statement, e.g. SELECT * FROM events WHERE is_mock = 0;"
            style={{
              width: '100%',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#0F172A',
              color: '#F8FAFC',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            Tip: Supports standard SQL syntax including <code style={{ color: '#0F766E' }}>SELECT</code>, <code style={{ color: '#0F766E' }}>SHOW TABLES</code>, and <code style={{ color: '#0F766E' }}>WHERE</code> filters.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunQuery}
            disabled={isExecutingSql}
            style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0F766E' }}
          >
            {isExecutingSql ? 'Running Query...' : '▶ Execute SQL Query'}
          </button>
        </div>

        {/* Query Result Output */}
        {queryResult && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                background: queryResult.error ? '#FEF2F2' : '#F1F5F9',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '11px',
              }}
            >
              <span style={{ color: queryResult.error ? '#991B1B' : '#0F172A', fontWeight: '700' }}>
                {queryResult.error ? 'Query Failed' : `Success · ${queryResult.rowCount} row(s) returned`}
              </span>
              <span style={{ color: '#64748B', fontFamily: 'monospace' }}>
                Execution Time: {queryResult.executionTimeMs} ms
              </span>
            </div>

            {queryResult.error ? (
              <div style={{ padding: '14px', color: '#B91C1C', fontSize: '12px', fontFamily: 'monospace', background: '#FFF5F5' }}>
                {queryResult.error}
              </div>
            ) : queryResult.rows.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                Empty result set. (0 rows returned matching filter)
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      {queryResult.columns.map((c) => (
                        <th key={c} style={{ padding: '8px 12px', fontWeight: '700', color: '#0F172A' }}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((r, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        {r.map((val, ci) => (
                          <td key={ci} style={{ padding: '8px 12px', whiteSpace: 'nowrap', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRestoreModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '14px',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#104A32' }}>
                  Restore Database &amp; Media Archive
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#527461' }}>
                  {uploadedZipFile
                    ? `Restoring complete ZIP archive: "${uploadedFileName}"`
                    : restoreTargetBackup
                    ? `Restoring from snapshot: "${restoreTargetBackup.name}"`
                    : `Restoring from file: "${uploadedFileName}"`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ×
              </button>
            </div>

            {/* ZIP Archive Inspection Badge */}
            {uploadedZipFile && zipInspection && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: zipInspection.isValid ? '#F0FDF4' : '#FEF2F2',
                  border: zipInspection.isValid ? '1px solid #BBF7D0' : '1px solid #FECACA',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{zipInspection.isValid ? '📦' : '⚠️'}</span>
                  <strong style={{ fontSize: '13px', color: zipInspection.isValid ? '#166534' : '#991B1B' }}>
                    {zipInspection.isValid ? 'Complete EventSphere ZIP Archive Verified' : 'Invalid Archive'}
                  </strong>
                </div>
                {zipInspection.isValid ? (
                  <div style={{ fontSize: '11px', color: '#15803D', lineHeight: '1.6' }}>
                    • <strong>Database Tables:</strong> {zipInspection.manifest?.stats.totalRecords ?? 'All'} records ({zipInspection.manifest?.stats.realRecords ?? '0'} real, {zipInspection.manifest?.stats.mockRecords ?? '0'} mock)
                    <br />
                    • <strong>Media Assets:</strong> {zipInspection.totalAssets} image files (Event banners, logos, attendee QR code passes)
                    <br />
                    • <strong>Generated:</strong> {zipInspection.manifest?.generatedAt ? new Date(zipInspection.manifest.generatedAt).toLocaleString() : 'Valid EventSphere Archive'}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#B91C1C' }}>
                    {zipInspection.error}
                  </div>
                )}
              </div>
            )}

            {/* Restore Mode Choice */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#104A32', display: 'block', marginBottom: '8px' }}>
                Select Restore Strategy:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: restoreMode === 'replace' ? '2px solid #10B981' : '1px solid #E2E8F0',
                    background: restoreMode === 'replace' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreMode === 'replace'}
                    onChange={() => setRestoreMode('replace')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>
                      Clean Overwrite (Replace all data &amp; media)
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Replaces existing tables and media completely with the backup archive content.
                    </span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: restoreMode === 'merge' ? '2px solid #10B981' : '1px solid #E2E8F0',
                    background: restoreMode === 'merge' ? '#F0FDF4' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>
                      Safe Merge (Preserve existing real data)
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      Appends records and media from the backup while keeping current user events and registrations intact.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Warning Note */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                fontSize: '11px',
                color: '#92400E',
                marginBottom: '20px',
              }}
            >
              ⚠️ <strong>Notice:</strong> Restoring will apply changes directly to the active PostgreSQL database tables and media store.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setRestoreModalOpen(false)}
                disabled={isRestoring}
                style={{ fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmRestore}
                disabled={isRestoring || (uploadedZipFile !== null && zipInspection?.isValid === false)}
                style={{ fontSize: '12px', background: '#104A32' }}
              >
                {isRestoring ? 'Restoring Archive...' : uploadedZipFile ? 'Confirm & Restore ZIP' : 'Confirm & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTICE */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#104A32',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
            zIndex: 10000,
            maxWidth: '440px',
          }}
        >
          {toast}
        </div>
      )}
    </section>
  );
};
