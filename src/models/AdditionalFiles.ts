type AdditionalFile = {
  filename: string;
  visible: boolean;
};

type AdditionalFiles = Array<AdditionalFile>;
type AdditionalFilesContents = Record<string, string>;

export { AdditionalFile, AdditionalFiles, AdditionalFilesContents };
