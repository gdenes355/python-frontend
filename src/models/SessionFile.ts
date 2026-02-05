type SessionFile = {
  filename: string;
  isText: boolean;
  data: ArrayBuffer | string | Uint8Array;
  mimeType?: string;
};

export { SessionFile };
