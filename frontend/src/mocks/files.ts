/**
 * In-memory blobs of files uploaded during this browser session, so "View file" can open the
 * real document in the demo. Seeded fixtures have no bytes; they get a generated summary page.
 * Not persisted: after a reload, uploaded files fall back to the summary page too.
 */
const blobs = new Map<string, Blob>();

export const mockFiles = {
  put(fileId: string, blob: Blob) {
    blobs.set(fileId, blob);
  },
  get(fileId: string): Blob | undefined {
    return blobs.get(fileId);
  },
};
