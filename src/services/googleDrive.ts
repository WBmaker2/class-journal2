// Google Drive API endpoints
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

interface FileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  appProperties?: {
    [key: string]: string;
  };
}

export const googleDriveService = {
  /**
   * Find the backup file metadata in Google Drive
   */
  getBackupMetadata: async (accessToken: string, fileName: string): Promise<FileMetadata | null> => {
    try {
      const query = `name = '${fileName}' and trashed = false`;
      const response = await fetch(`${DRIVE_API_URL}?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,appProperties)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
      
      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0] : null;
    } catch (err) {
      console.error('Error finding backup file:', err);
      throw err;
    }
  },

  /**
   * Find the backup file ID (Legacy support)
   */
  findBackupFile: async (accessToken: string, fileName: string): Promise<string | null> => {
    const metadata = await googleDriveService.getBackupMetadata(accessToken, fileName);
    return metadata ? metadata.id : null;
  },

  /**
   * Create a new backup file using fetch (multipart upload)
   */
  createBackupFile: async (accessToken: string, fileName: string, data: any, appProperties?: any): Promise<void> => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      appProperties: appProperties,
    };

    const body = 
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;

    try {
      const response = await fetch(`${UPLOAD_API_URL}?uploadType=multipart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error creating backup file:', err);
      throw err;
    }
  },

  /**
   * Update an existing backup file using fetch (multipart to update metadata + content)
   */
  updateBackupFile: async (accessToken: string, fileId: string, data: any, appProperties?: any): Promise<void> => {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      mimeType: 'application/json',
      appProperties: appProperties,
    };

    const body = 
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;

    try {
      const response = await fetch(`${UPLOAD_API_URL}/${fileId}?uploadType=multipart`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      console.error('Error updating backup file:', err);
      throw err;
    }
  },

  /**
   * Download the backup file content using fetch
   */
  downloadBackupFile: async (accessToken: string, fileId: string): Promise<any> => {
    try {
      const response = await fetch(`${DRIVE_API_URL}/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
      
      return await response.json();
    } catch (err) {
      console.error('Error downloading backup file:', err);
      throw err;
    }
  }
};