import JSZip from 'jszip';
import { sqlDb } from '../db/sqlDatabase';
import { EventData, Attendee, DatabaseBackup } from '../types';

export interface ZipArchiveManifest {
  version: string;
  format: 'eventsphere-full-archive';
  generatedAt: string;
  generatedBy: string;
  databaseEngine: string;
  stats: {
    totalRecords: number;
    realRecords: number;
    mockRecords: number;
    eventsCount: number;
    attendeesCount: number;
    assetsCount: number;
    tableCounts: Record<string, number>;
  };
  assets: Array<{
    type: 'event_cover' | 'event_logo' | 'ticket_qr' | 'user_avatar' | 'org_logo';
    id: string;
    filename: string;
    originalSource?: string;
  }>;
}

export interface ZipInspectionResult {
  isValid: boolean;
  manifest?: ZipArchiveManifest;
  filesList: string[];
  totalAssets: number;
  databaseJsonPresent: boolean;
  databaseSqlPresent: boolean;
  error?: string;
}

/**
 * Helper to convert a Data URL, Blob URL, or fetchable remote image into base64 binary.
 */
async function resolveImageBinary(
  urlOrData: string | undefined
): Promise<{ ext: string; base64: string } | null> {
  if (!urlOrData) return null;

  // 1. Data URL (User upload via FileReader)
  if (urlOrData.startsWith('data:image/')) {
    const matches = urlOrData.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (matches) {
      let ext = matches[1].toLowerCase();
      if (ext === 'svg+xml') ext = 'svg';
      else if (ext === 'jpeg') ext = 'jpg';
      return { ext, base64: matches[2] };
    }
  }

  // 2. Remote URL or local Blob URL
  if (urlOrData.startsWith('http://') || urlOrData.startsWith('https://') || urlOrData.startsWith('blob:')) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(urlOrData, { signal: controller.signal, mode: 'cors' });
      clearTimeout(timer);
      if (res.ok) {
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const matches = result.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (matches) {
              let ext = matches[1].toLowerCase();
              if (ext === 'svg+xml') ext = 'svg';
              else if (ext === 'jpeg') ext = 'jpg';
              resolve({ ext, base64: matches[2] });
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // CORS or network failure, will record originalSource in manifest
      return null;
    }
  }

  return null;
}

/**
 * Creates a comprehensive full .zip archive containing:
 * - database.sql (PostgreSQL DDL & DML script)
 * - database.json (Full JSON dump)
 * - manifest.json (Metadata, asset index, record counts)
 * - assets/events/ (Event cover banners & custom event logos)
 * - assets/tickets/ (Scannable attendee QR code passes)
 * - assets/orgs/ (Organization logos)
 */
export async function createFullZipBackup(
  customTitle?: string,
  adminName: string = 'System Administrator'
): Promise<{ blob: Blob; filename: string; manifest: ZipArchiveManifest }> {
  const zip = new JSZip();
  const timestamp = new Date().toISOString();
  const dateSlug = timestamp.slice(0, 10);
  const timeSlug = timestamp.slice(11, 19).replace(/:/g, '-');
  const filename = customTitle
    ? `${customTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`
    : `eventsphere-full-backup-${dateSlug}-${timeSlug}.zip`;

  const events = sqlDb.getEvents();
  const attendees = sqlDb.getAttendees();
  const users = sqlDb.getUsers();
  const organizations = sqlDb.getOrganizations();
  const notifications = sqlDb.getNotifications();
  const auditLogs = sqlDb.getAuditLogs();
  const withdrawals = sqlDb.getWithdrawalRequests();
  const footerSettings = sqlDb.getFooterSettings();
  const dbStats = sqlDb.getDatabaseStats();

  const manifestAssets: ZipArchiveManifest['assets'] = [];

  // Create subfolders in zip
  const assetsFolder = zip.folder('assets');
  const eventsFolder = assetsFolder?.folder('events');
  const ticketsFolder = assetsFolder?.folder('tickets');
  const orgsFolder = assetsFolder?.folder('orgs');

  // Process and package images
  const processImage = async (
    dataOrUrl: string | undefined,
    prefix: string,
    id: string,
    type: 'event_cover' | 'event_logo' | 'ticket_qr' | 'org_logo'
  ): Promise<string | null> => {
    if (!dataOrUrl) return null;

    const resolved = await resolveImageBinary(dataOrUrl);
    if (resolved) {
      const fileName = `${prefix}_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.${resolved.ext}`;
      if (type === 'ticket_qr') {
        ticketsFolder?.file(fileName, resolved.base64, { base64: true });
        manifestAssets.push({
          type,
          id,
          filename: `assets/tickets/${fileName}`,
        });
      } else if (type === 'org_logo') {
        orgsFolder?.file(fileName, resolved.base64, { base64: true });
        manifestAssets.push({
          type,
          id,
          filename: `assets/orgs/${fileName}`,
        });
      } else {
        eventsFolder?.file(fileName, resolved.base64, { base64: true });
        manifestAssets.push({
          type,
          id,
          filename: `assets/events/${fileName}`,
        });
      }
      return fileName;
    } else {
      manifestAssets.push({
        type,
        id,
        filename: dataOrUrl,
        originalSource: dataOrUrl,
      });
      return null;
    }
  };

  // 1. Pack Event Covers & Logos (banners & event logos)
  for (const evt of events) {
    if (evt.coverImage) {
      await processImage(evt.coverImage, 'cover', evt.id, 'event_cover');
    }
    if (evt.logoImage) {
      await processImage(evt.logoImage, 'logo', evt.id, 'event_logo');
    }
  }

  // 2. Pack Organization Logos
  for (const org of organizations) {
    if (org.logo) {
      await processImage(org.logo, 'logo', org.id, 'org_logo');
    }
  }

  // 3. Pack Attendee QR Code Passes
  for (const att of attendees) {
    if (att.qrDataUrl) {
      await processImage(att.qrDataUrl, 'qr', att.ticketCode || att.id, 'ticket_qr');
    }
  }

  // 3. Generate Database SQL Dump
  const sqlDump = sqlDb.generateSqlDump();
  zip.file('database.sql', sqlDump);

  // 4. Generate Database JSON Export
  const databaseJsonPayload = {
    version: '2.4.0',
    exportedAt: timestamp,
    createdBy: adminName,
    databaseEngine: 'PostgreSQL Relational / EventSphere SQL Engine v2.4',
    stats: dbStats,
    data: {
      events,
      attendees,
      users,
      organizations,
      notifications,
      auditLogs,
      withdrawalRequests: withdrawals,
      footerSettings,
    },
  };
  zip.file('database.json', JSON.stringify(databaseJsonPayload, null, 2));

  // 5. Generate Manifest
  const manifest: ZipArchiveManifest = {
    version: '2.4.0',
    format: 'eventsphere-full-archive',
    generatedAt: timestamp,
    generatedBy: adminName,
    databaseEngine: 'PostgreSQL Relational v2.4',
    stats: {
      totalRecords: dbStats.totalRecords,
      realRecords: dbStats.realRecords,
      mockRecords: dbStats.mockRecords,
      eventsCount: events.length,
      attendeesCount: attendees.length,
      assetsCount: manifestAssets.length,
      tableCounts: {
        events: events.length,
        attendees: attendees.length,
        users: users.length,
        organizations: organizations.length,
        notifications: notifications.length,
        auditLogs: auditLogs.length,
        withdrawalRequests: withdrawals.length,
      },
    },
    assets: manifestAssets,
  };
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // 6. Generate Readme
  const readmeContent = `# EventSphere Complete Database & Media Archive
Archive Generated: ${timestamp}
Platform Engine: PostgreSQL 16 Compatible
Created By: ${adminName}

## Contents of this Archive:
- database.sql: Complete relational schema and SQL INSERT statements for all tables
- database.json: Structured JSON data format for automated import
- manifest.json: Index of all tables, counts, and asset mappings
- assets/events/: User-uploaded event cover banners and custom event logos
- assets/tickets/: Attendee scannable QR ticket barcodes and passes

## Restoration:
You can restore this archive directly via the EventSphere System Admin > SQL DB & Backups center.
Supports both Clean Overwrite and Safe Merge modes.
`;
  zip.file('README.txt', readmeContent);

  // Generate the ZIP blob with compression
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { blob, filename, manifest };
}

/**
 * Inspects a candidate ZIP file without committing any changes.
 * Returns metadata, manifest details, asset counts, and validity status.
 */
export async function inspectZipBackup(file: File | Blob): Promise<ZipInspectionResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    const filesList = Object.keys(zip.files);

    const hasSql = filesList.includes('database.sql');
    const hasJson = filesList.includes('database.json');
    const hasManifest = filesList.includes('manifest.json');

    if (!hasSql && !hasJson && !hasManifest) {
      return {
        isValid: false,
        filesList,
        totalAssets: 0,
        databaseJsonPresent: false,
        databaseSqlPresent: false,
        error: 'Archive does not contain database.sql, database.json, or manifest.json. Ensure this is an EventSphere backup archive.',
      };
    }

    let manifest: ZipArchiveManifest | undefined;
    if (hasManifest) {
      try {
        const manifestText = await zip.file('manifest.json')?.async('text');
        if (manifestText) manifest = JSON.parse(manifestText);
      } catch (e) {
        console.warn('Failed to parse manifest.json from zip:', e);
      }
    }

    const assetFiles = filesList.filter((f) => f.startsWith('assets/') && !f.endsWith('/'));

    return {
      isValid: true,
      manifest,
      filesList,
      totalAssets: assetFiles.length,
      databaseJsonPresent: hasJson,
      databaseSqlPresent: hasSql,
    };
  } catch (err: any) {
    return {
      isValid: false,
      filesList: [],
      totalAssets: 0,
      databaseJsonPresent: false,
      databaseSqlPresent: false,
      error: `Corrupt or unreadable ZIP archive: ${err.message || String(err)}`,
    };
  }
}

/**
 * Restores a full ZIP backup archive into the SQL database.
 * Reconnects images, covers, logos, and QR codes into the respective events and attendees.
 */
export async function restoreFromZipBackup(
  file: File | Blob,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string; restoredCounts?: Record<string, number> }> {
  try {
    const zip = await JSZip.loadAsync(file);

    // 1. Read manifest
    let manifest: ZipArchiveManifest | null = null;
    const manifestFile = zip.file('manifest.json');
    if (manifestFile) {
      try {
        manifest = JSON.parse(await manifestFile.async('text'));
      } catch (e) {
        console.warn('Could not read manifest.json from zip:', e);
      }
    }

    // 2. Read database.json
    const dbJsonFile = zip.file('database.json');
    if (!dbJsonFile) {
      // Fallback: check for database.sql
      const sqlFile = zip.file('database.sql');
      if (sqlFile) {
        const sqlContent = await sqlFile.async('text');
        const sqlRes = sqlDb.executeSql(sqlContent);
        if (sqlRes.error) {
          return { success: false, message: `SQL Execution failed during restore: ${sqlRes.error}` };
        }
        return {
          success: true,
          message: 'Database restored successfully from database.sql script inside archive.',
        };
      }
      return { success: false, message: 'Invalid ZIP archive: Neither database.json nor database.sql found.' };
    }

    const rawDataJson = await dbJsonFile.async('text');
    const parsedData = JSON.parse(rawDataJson);
    const data = parsedData.data || parsedData;

    // 3. Extract and rehydrate asset images (banners, logos, QR codes)
    const assetFiles = Object.keys(zip.files).filter((f) => f.startsWith('assets/') && !f.endsWith('/'));
    const assetDataUrls: Record<string, string> = {};

    for (const assetPath of assetFiles) {
      try {
        const fileObj = zip.file(assetPath);
        if (fileObj) {
          const base64Str = await fileObj.async('base64');
          let mime = 'image/png';
          if (assetPath.endsWith('.jpg') || assetPath.endsWith('.jpeg')) mime = 'image/jpeg';
          else if (assetPath.endsWith('.svg')) mime = 'image/svg+xml';
          else if (assetPath.endsWith('.webp')) mime = 'image/webp';

          assetDataUrls[assetPath] = `data:${mime};base64,${base64Str}`;
        }
      } catch (err) {
        console.warn(`Could not extract asset ${assetPath}:`, err);
      }
    }

    // 4. Re-link assets into events
    if (Array.isArray(data.events)) {
      data.events = data.events.map((evt: EventData) => {
        const updated = { ...evt };
        // Check for extracted cover
        const coverMatch = Object.keys(assetDataUrls).find(
          (p) => p.includes(`cover_${evt.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`)
        );
        if (coverMatch) {
          updated.coverImage = assetDataUrls[coverMatch];
        }
        // Check for extracted logo
        const logoMatch = Object.keys(assetDataUrls).find(
          (p) => p.includes(`logo_${evt.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`)
        );
        if (logoMatch) {
          updated.logoImage = assetDataUrls[logoMatch];
        }
        return updated;
      });
    }

    // 5. Re-link assets into attendees (QR codes)
    if (Array.isArray(data.attendees)) {
      data.attendees = data.attendees.map((att: Attendee) => {
        const updated = { ...att };
        const idOrCode = (att.ticketCode || att.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        const qrMatch = Object.keys(assetDataUrls).find((p) => p.includes(`qr_${idOrCode}`));
        if (qrMatch) {
          updated.qrDataUrl = assetDataUrls[qrMatch];
        }
        return updated;
      });
    }

    // 6. Re-link assets into organizations (logos)
    if (Array.isArray(data.organizations)) {
      data.organizations = data.organizations.map((org: any) => {
        const updated = { ...org };
        const idClean = org.id ? org.id.replace(/[^a-zA-Z0-9_-]/g, '_') : '';
        const logoMatch = Object.keys(assetDataUrls).find((p) => p.includes(`logo_${idClean}`));
        if (logoMatch) {
          updated.logo = assetDataUrls[logoMatch];
        }
        return updated;
      });
    }

    // 7. Restore through sqlDb
    const restoreResult = sqlDb.restoreFromJson(data, mode);
    if (!restoreResult.success) {
      return restoreResult;
    }

    const currentStats = sqlDb.getDatabaseStats();
    return {
      success: true,
      message: `Complete ZIP Archive restored successfully (${mode === 'replace' ? 'Clean Overwrite' : 'Safe Merge'}). Restored ${currentStats.totalRecords} records and rehydrated ${assetFiles.length} media assets (covers, logos, QR codes).`,
      restoredCounts: {
        events: currentStats.tables.find((t) => t.tableName === 'events')?.totalRows || 0,
        attendees: currentStats.tables.find((t) => t.tableName === 'attendees')?.totalRows || 0,
        assets: assetFiles.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to restore ZIP archive: ${err.message || String(err)}`,
    };
  }
}
